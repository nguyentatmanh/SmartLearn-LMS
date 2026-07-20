import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.profile import TeacherProfile, TeacherApprovalStatus
from app.models.course import Course, CourseStatus, CourseReviewStatus
from app.models.setting import SystemSetting
from app.models.audit import AuditLog
from app.services.audit_service import sanitize_details, log_audit_event, log_audit_failure
from app.services.teacher_approval import TeacherApprovalService
from app.services.admin_user_service import AdminUserService
from app.services.course_moderation import CourseModerationService
from app.services.settings_service import SettingsService
from app.scripts.reconcile_teachers import reconcile_teachers

# Setup in-memory SQLite for unit tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Seed default system settings row id=1
    settings = SystemSetting(id=1, require_teacher_approval=True, require_email_verification=False, require_course_review=False)
    db.add(settings)
    db.commit()

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    try:
        yield db
    finally:
        app.dependency_overrides.clear()
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_sanitize_details_sensitive_fields():
    payload = {
        "password": "secret_password_123",
        "email": "admin@smartlearn.vn",
        "nested": {"token": "bearer_xyz", "data": "ok"}
    }
    cleaned = sanitize_details(payload)
    assert cleaned["password"] == "[REDACTED]"
    assert cleaned["email"] == "admin@smartlearn.vn"
    assert cleaned["nested"]["token"] == "[REDACTED]"
    assert cleaned["nested"]["data"] == "ok"


def test_rejected_teacher_always_blocked(db_session):
    admin = User(email="admin@test.com", hashed_password="pw", full_name="Admin", role=UserRole.ADMIN, is_active=True, email_verified=True)
    teacher = User(email="teacher@test.com", hashed_password="pw", full_name="Teacher", role=UserRole.TEACHER, is_active=True, email_verified=True, is_approved=False)
    db_session.add_all([admin, teacher])
    db_session.commit()

    profile = TeacherProfile(user_id=teacher.id, approval_status=TeacherApprovalStatus.REJECTED, rejection_reason="Invalid credentials")
    db_session.add(profile)
    db_session.commit()

    # Disable require_teacher_approval policy
    SettingsService.update_settings(db_session, {"require_teacher_approval": False}, admin.id)

    # Re-evaluate dependency logic for rejected teacher
    from app.api.deps import get_current_active_teacher
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        get_current_active_teacher(db_session, teacher)
    assert exc_info.value.status_code == 403
    assert "rejected" in exc_info.value.detail.lower()


def test_stale_course_approval_invalidation(db_session):
    admin = User(email="admin@test.com", hashed_password="pw", full_name="Admin", role=UserRole.ADMIN, is_active=True, email_verified=True)
    teacher = User(email="teacher@test.com", hashed_password="pw", full_name="Teacher", role=UserRole.TEACHER, is_active=True, email_verified=True)
    db_session.add_all([admin, teacher])
    db_session.commit()

    course = Course(title="Python 101", teacher_id=teacher.id, status=CourseStatus.DRAFT, content_revision=1)
    db_session.add(course)
    db_session.commit()

    # 1. Teacher submits review
    CourseModerationService.submit_for_review(db_session, course.id, teacher.id)
    assert course.review_status == CourseReviewStatus.PENDING
    assert course.submitted_revision == 1

    # 2. Admin approves review
    CourseModerationService.approve_review(db_session, course.id, admin.id)
    assert course.review_status == CourseReviewStatus.APPROVED
    assert course.approved_revision == 1

    # 3. Teacher edits course -> content_revision increments to 2 and review_status resets to NOT_SUBMITTED
    CourseModerationService.increment_content_revision(db_session, course)
    assert course.content_revision == 2
    assert course.review_status == CourseReviewStatus.NOT_SUBMITTED
    assert course.approved_revision is None

    # 4. Attempting to publish when review is required raises 409 STALE_OR_MISSING_APPROVAL
    SettingsService.update_settings(db_session, {"require_course_review": True}, admin.id)
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        CourseModerationService.update_course_status(db_session, course.id, CourseStatus.PUBLISHED, teacher)
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["code"] == "STALE_OR_MISSING_APPROVAL"


def test_last_admin_protection(db_session):
    admin = User(email="onlyadmin@test.com", hashed_password="pw", full_name="Only Admin", role=UserRole.ADMIN, is_active=True, email_verified=True)
    db_session.add(admin)
    db_session.commit()

    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        AdminUserService.update_user_role(db_session, admin.id, UserRole.STUDENT, admin.id)
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["code"] == "LAST_ADMIN_PROTECTED"

    with pytest.raises(HTTPException) as exc_info:
        AdminUserService.toggle_user_active(db_session, admin.id, False, admin.id)
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["code"] == "LAST_ADMIN_PROTECTED"


def test_admin_policy_lockout_risk(db_session):
    # Active admin with unverified email
    admin = User(email="unverifiedadmin@test.com", hashed_password="pw", full_name="Unverified Admin", role=UserRole.ADMIN, is_active=True, email_verified=False)
    db_session.add(admin)
    db_session.commit()

    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        SettingsService.update_settings(db_session, {"require_email_verification": True}, admin.id)
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["code"] == "ADMIN_POLICY_LOCKOUT_RISK"


def test_reconcile_teachers_cli(db_session):
    teacher = User(email="sync_teacher@test.com", hashed_password="pw", full_name="Sync Teacher", role=UserRole.TEACHER, is_active=True, email_verified=True, is_approved=False)
    db_session.add(teacher)
    db_session.commit()

    profile = TeacherProfile(user_id=teacher.id, approval_status=TeacherApprovalStatus.APPROVED)
    db_session.add(profile)
    db_session.commit()

    # Inconsistent: TeacherProfile is APPROVED but User.is_approved is False
    assert teacher.is_approved is False

    # Dry-run does not mutate DB
    reconcile_teachers(apply=False)
    db_session.refresh(teacher)
    assert teacher.is_approved is False


# REGRESSION TESTS
def test_valid_admin_login_and_auth_me(db_session):
    client = TestClient(app)
    pwd_hash = get_password_hash("AdminPass123!")
    admin = User(
        email="admin_login@smartlearn.vn",
        hashed_password=pwd_hash,
        full_name="Valid Admin",
        role=UserRole.ADMIN,
        is_active=True,
        email_verified=True
    )
    db_session.add(admin)
    db_session.commit()

    # 1. Login request
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin_login@smartlearn.vn", "password": "AdminPass123!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data

    # 2. Login followed by /auth/me
    token = token_data["access_token"]
    me_response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == "admin_login@smartlearn.vn"
    assert me_data["role"] == "admin"

    # 3. Verified admin dashboard access (/api/v1/admin/overview)
    admin_req = client.get("/api/v1/admin/overview", headers={"Authorization": f"Bearer {token}"})
    assert admin_req.status_code == 200
    assert "metrics" in admin_req.json()


def test_unverified_admin_policy_behavior(db_session):
    client = TestClient(app)
    pwd_hash = get_password_hash("AdminPass123!")
    admin = User(
        email="unverified_admin@smartlearn.vn",
        hashed_password=pwd_hash,
        full_name="Unverified Admin",
        role=UserRole.ADMIN,
        is_active=True,
        email_verified=False
    )
    db_session.add(admin)
    db_session.commit()

    # Turn ON email verification requirement policy
    SettingsService.update_settings(db_session, {"require_email_verification": False}, admin.id)
    # Update directly to test blocking
    settings = db_session.query(SystemSetting).first()
    settings.require_email_verification = True
    db_session.commit()

    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "unverified_admin@smartlearn.vn", "password": "AdminPass123!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # /auth/me should return 403 when email verification policy is required and user is unverified
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 403
    assert "verify" in me_res.json()["detail"].lower()


def test_missing_pending_migration_failure_detection(db_session):
    # Test that querying system_settings when row is missing recovers or throws explicit error
    db_session.query(SystemSetting).delete()
    db_session.commit()

    # get_settings should recreate singleton row safely
    st = SettingsService.get_settings(db_session)
    assert st.id == 1


def check_no_sensitive_keys_recursive(obj, blocked_keys={"password", "hashed_password", "password_hash", "otp", "otp_hash", "token", "access_token", "refresh_token", "reset_token", "secret", "session_id"}):
    if isinstance(obj, dict):
        for k, v in obj.items():
            assert k.lower() not in blocked_keys, f"Sensitive key '{k}' exposed in response!"
            check_no_sensitive_keys_recursive(v, blocked_keys)
    elif isinstance(obj, list):
        for item in obj:
            check_no_sensitive_keys_recursive(item, blocked_keys)


def test_user_detail_endpoint_privacy_and_profiles(db_session):
    client = TestClient(app)
    pwd_hash = get_password_hash("AdminPass123!")

    admin = User(email="admin_dt@test.com", hashed_password=pwd_hash, full_name="Admin User", role=UserRole.ADMIN, is_active=True, email_verified=True)
    student = User(email="student_dt@test.com", hashed_password=pwd_hash, full_name="Student User", role=UserRole.STUDENT, is_active=True, email_verified=True)
    teacher = User(email="teacher_dt@test.com", hashed_password=pwd_hash, full_name="Teacher User", role=UserRole.TEACHER, is_active=True, email_verified=True)

    db_session.add_all([admin, student, teacher])
    db_session.commit()

    teacher_prof = TeacherProfile(user_id=teacher.id, faculty="CS", department="IT", specialization="AI", approval_status=TeacherApprovalStatus.APPROVED)
    db_session.add(teacher_prof)
    db_session.commit()

    # Add audit log for target user
    log_target = AuditLog(event_type="USER_ROLE_CHANGED", actor_id=admin.id, target_type="user", target_id=str(student.id), result="success")
    # Add audit log by student
    log_actor = AuditLog(event_type="USER_LOGIN", actor_id=student.id, target_type="auth", target_id=str(student.id), result="success")
    db_session.add_all([log_target, log_actor])
    db_session.commit()

    # Login as admin to get token
    login_res = client.post("/api/v1/auth/login", data={"username": "admin_dt@test.com", "password": "AdminPass123!"}, headers={"Content-Type": "application/x-www-form-urlencoded"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Non-admin 403 test
    login_st = client.post("/api/v1/auth/login", data={"username": "student_dt@test.com", "password": "AdminPass123!"}, headers={"Content-Type": "application/x-www-form-urlencoded"})
    st_token = login_st.json()["access_token"]
    res_st = client.get(f"/api/v1/admin/users/{student.id}", headers={"Authorization": f"Bearer {st_token}"})
    assert res_st.status_code == 403

    # 2. Missing user 404 test
    res_404 = client.get("/api/v1/admin/users/99999", headers=headers)
    assert res_404.status_code == 404

    # 3. Student detail test & privacy check
    res_student = client.get(f"/api/v1/admin/users/{student.id}", headers=headers)
    assert res_student.status_code == 200
    st_data = res_student.json()
    assert st_data["email"] == "student_dt@test.com"
    assert st_data["profile"]["type"] == "student"
    assert "student_details" in st_data["profile"]
    check_no_sensitive_keys_recursive(st_data)

    # 4. Teacher detail test & privacy check
    res_teacher = client.get(f"/api/v1/admin/users/{teacher.id}", headers=headers)
    assert res_teacher.status_code == 200
    t_data = res_teacher.json()
    assert t_data["profile"]["type"] == "teacher"
    assert t_data["profile"]["teacher_details"]["faculty"] == "CS"
    check_no_sensitive_keys_recursive(t_data)

    # 5. Admin detail test & privacy check
    res_admin = client.get(f"/api/v1/admin/users/{admin.id}", headers=headers)
    assert res_admin.status_code == 200
    a_data = res_admin.json()
    assert a_data["profile"]["type"] == "admin"
    check_no_sensitive_keys_recursive(a_data)

    # 6. Verify audit logs ordering and categorization
    st_logs = st_data["recent_activities"]
    assert len(st_logs) >= 2
    categories = [l["activity_category"] for l in st_logs]
    assert "target" in categories
    assert "actor" in categories

