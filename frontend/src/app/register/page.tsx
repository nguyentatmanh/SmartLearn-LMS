'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import AppHeader from '@/components/Header';
import { 
  GraduationCap, Mail, Lock, User, Loader2, AlertCircle, Shield, 
  Phone, Calendar, Briefcase, Bookmark, FileText 
} from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').transform(val => val.trim()),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phoneNumber: z.string().min(9, 'Phone number is too short').max(15, 'Phone number is too long').regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format'),
  dateOfBirth: z.string().min(1, 'Date of birth is required').refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d < new Date();
  }, 'Date of birth must be in the past'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['student', 'teacher'], {
    required_error: 'Role selection is required',
  }),
  // Teacher-specific fields
  faculty: z.string().optional(),
  department: z.string().optional(),
  specialization: z.string().optional(),
  academicTitle: z.string().optional(),
  teacherCode: z.string().optional(),
  bio: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === 'teacher') {
    return !!data.faculty && data.faculty.trim().length > 0;
  }
  return true;
}, {
  message: "Faculty is required for teachers",
  path: ["faculty"],
}).refine((data) => {
  if (data.role === 'teacher') {
    return !!data.department && data.department.trim().length > 0;
  }
  return true;
}, {
  message: "Department is required for teachers",
  path: ["department"],
}).refine((data) => {
  if (data.role === 'teacher') {
    return !!data.specialization && data.specialization.trim().length > 0;
  }
  return true;
}, {
  message: "Specialization is required for teachers",
  path: ["specialization"],
});

type RegisterSchemaType = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <main className="min-h-dvh flex flex-col bg-background text-foreground transition-colors duration-300">
      {isMounted ? (
        <AppHeader />
      ) : (
        <div className="h-16 w-full glass border-b border-border backdrop-blur-md" />
      )}

      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        {isMounted && (
          <>
            <div className="absolute top-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
          </>
        )}

        <div className="w-full max-w-lg glass rounded-2xl p-6 sm:p-8 border border-border relative shadow-xl space-y-6 my-8">
          {!isMounted ? (
            <div className="space-y-6">
              <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
              <div className="mx-auto h-8 w-56 animate-pulse rounded-lg bg-black/10 dark:bg-white/10" />
              <div className="mx-auto h-5 w-80 max-w-full animate-pulse rounded-lg bg-black/10 dark:bg-white/10" />
              <div className="mt-6 space-y-4">
                <div className="h-12 animate-pulse rounded-xl bg-black/10 dark:bg-white/10" />
                <div className="h-12 animate-pulse rounded-xl bg-black/10 dark:bg-white/10" />
                <div className="h-12 animate-pulse rounded-xl bg-black/10 dark:bg-white/10" />
                <div className="h-12 animate-pulse rounded-xl bg-black/10 dark:bg-white/10" />
              </div>
            </div>
          ) : (
            <RegisterFormContent />
          )}
        </div>
      </div>
    </main>
  );
}

function RegisterFormContent() {
  const { register: registerUser } = useAuth();
  const { t, language } = usePreference();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'student',
      fullName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      password: '',
      confirmPassword: '',
      faculty: '',
      department: '',
      specialization: '',
      academicTitle: '',
      teacherCode: '',
      bio: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterSchemaType) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload: any = {
        email: data.email,
        password: data.password,
        full_name: data.fullName,
        phone_number: data.phoneNumber,
        date_of_birth: data.dateOfBirth,
        role: data.role,
      };
      if (data.role === 'teacher') {
        payload.faculty = data.faculty;
        payload.department = data.department;
        payload.specialization = data.specialization;
        payload.academic_title = data.academicTitle || null;
        payload.teacher_code = data.teacherCode || null;
        payload.bio = data.bio || null;
      }
      const res = await registerUser(payload);
      if (res && res.email_verification_required) {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    } catch (err: any) {
      console.error(err);
      if (!err.response || !err.response.data) {
        setErrorMsg(
          language === 'en'
            ? 'Registration failed. Please verify your connection.'
            : 'Đăng ký thất bại. Vui lòng kiểm tra kết nối mạng.'
        );
        return;
      }

      const detail = err.response.data.detail;
      if (!detail) {
        setErrorMsg(
          language === 'en'
            ? 'Registration failed. Please make sure credentials are correct and unique.'
            : 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin đăng ký.'
        );
        return;
      }

      if (typeof detail === 'string') {
        const detailLower = detail.toLowerCase();
        if (detailLower.includes('email already registered') || detailLower.includes('already exists') || detailLower.includes('registered')) {
          setErrorMsg(
            language === 'en'
              ? 'This email address is already registered. Please log in or use another email.'
              : 'Địa chỉ email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.'
          );
        } else if (detailLower.includes('admin')) {
          setErrorMsg(
            language === 'en'
              ? 'Public registration of administrator accounts is not permitted.'
              : 'Hệ thống không cho phép đăng ký tài khoản quản trị viên công khai.'
          );
        } else {
          setErrorMsg(detail);
        }
      } else if (Array.isArray(detail)) {
        const messages = detail.map((errItem: any) => {
          let msg = errItem.msg || '';
          if (msg.startsWith('Value error, ')) {
            msg = msg.replace('Value error, ', '');
          }

          const msgLower = msg.toLowerCase();
          const field = errItem.loc && errItem.loc.length > 1 ? errItem.loc[1] : '';

          if (msgLower.includes('uppercase')) {
            return language === 'en'
              ? 'Password must contain at least one uppercase letter.'
              : 'Mật khẩu phải chứa ít nhất một chữ cái in hoa.';
          }
          if (msgLower.includes('lowercase')) {
            return language === 'en'
              ? 'Password must contain at least one lowercase letter.'
              : 'Mật khẩu phải chứa ít nhất một chữ cái in thường.';
          }
          if (msgLower.includes('at least 8 characters')) {
            return language === 'en'
              ? 'Password must be at least 8 characters long.'
              : 'Mật khẩu phải dài ít nhất 8 ký tự.';
          }
          if (msgLower.includes('number') || msgLower.includes('digit')) {
            if (field === 'phone_number') {
              return language === 'en'
                ? 'Phone number must be between 9 and 15 digits.'
                : 'Số điện thoại phải từ 9 đến 15 chữ số.';
            }
            return language === 'en'
              ? 'Password must contain at least one number.'
              : 'Mật khẩu phải chứa ít nhất một chữ số.';
          }
          if (msgLower.includes('special character')) {
            return language === 'en'
              ? 'Password must contain at least one special character.'
              : 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt.';
          }
          if (msgLower.includes('future') || msgLower.includes('past')) {
            return language === 'en'
              ? 'Date of birth must be in the past.'
              : 'Ngày sinh phải là một ngày trong quá khứ.';
          }
          if (msgLower.includes('phone') || msgLower.includes('invalid phone')) {
            return language === 'en'
              ? 'Invalid phone number format.'
              : 'Định dạng số điện thoại không hợp lệ.';
          }
          if (msgLower.includes('faculty')) {
            return language === 'en'
              ? 'Faculty is required for teachers.'
              : 'Thông tin Khoa là bắt buộc đối với giáo viên.';
          }
          if (msgLower.includes('department')) {
            return language === 'en'
              ? 'Department is required for teachers.'
              : 'Thông tin Bộ môn là bắt buộc đối với giáo viên.';
          }
          if (msgLower.includes('specialization')) {
            return language === 'en'
              ? 'Specialization is required for teachers.'
              : 'Thông tin Chuyên ngành là bắt buộc đối với giáo viên.';
          }
          if (msgLower.includes('blank') || msgLower.includes('empty')) {
            if (field === 'full_name') {
              return language === 'en'
                ? 'Full name cannot be blank.'
                : 'Họ và tên không được để trống.';
            }
          }
          return msg;
        });
        setErrorMsg(messages.join('\n'));
      } else {
        setErrorMsg(JSON.stringify(detail));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
          
          {/* Logo and header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-2">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">{t('registerTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('registerSubtitle')}</p>
          </div>

          {/* Global error display */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/25 text-danger text-sm rounded-lg whitespace-pre-line text-left">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Registration form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Role selector field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('registerRoleLabel')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('role', 'student')}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    selectedRole === 'student'
                      ? 'border-primary bg-primary/10 text-primary shadow-sm font-bold'
                      : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <GraduationCap className="h-4 w-4" />
                  {t('studentRole')}
                </button>
                <button
                  type="button"
                  onClick={() => setValue('role', 'teacher')}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    selectedRole === 'teacher'
                      ? 'border-primary bg-primary/10 text-primary shadow-sm font-bold'
                      : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  {t('teacherRole')}
                </button>
              </div>
            </div>

            {/* SECTION 1: Account Information */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <h3 className="text-sm font-extrabold text-primary flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t('sectionAccountInfo')}
              </h3>

              {/* Email field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">{t('emailLabel')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                  <input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    {...register('email')}
                    className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>
                {errors.email && (
                  <span className="text-xs text-danger font-medium">{errors.email.message}</span>
                )}
              </div>

              {/* Password row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('passwordLabel')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                    <input
                      type="password"
                      placeholder={t('passwordPlaceholder')}
                      {...register('password')}
                      className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                    />
                  </div>
                  {errors.password && (
                    <span className="text-xs text-danger font-medium leading-tight block">{errors.password.message}</span>
                  )}
                </div>

                {/* Confirm Password field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {language === 'en' ? 'Confirm Password' : 'Xác nhận mật khẩu'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                    <input
                      type="password"
                      placeholder={t('confirmPasswordPlaceholder')}
                      {...register('confirmPassword')}
                      className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <span className="text-xs text-danger font-medium">{errors.confirmPassword.message}</span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: Personal Information */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <h3 className="text-sm font-extrabold text-primary flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('sectionPersonalInfo')}
              </h3>

              {/* Full Name field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">{t('fullNameLabel')}</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                  <input
                    type="text"
                    placeholder={t('fullNamePlaceholder')}
                    {...register('fullName')}
                    className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>
                {errors.fullName && (
                  <span className="text-xs text-danger font-medium">{errors.fullName.message}</span>
                )}
              </div>

              {/* Phone and Date of Birth row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('phoneNumberLabel')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                    <input
                      type="text"
                      placeholder={t('phoneNumberPlaceholder')}
                      {...register('phoneNumber')}
                      className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <span className="text-xs text-danger font-medium">{errors.phoneNumber.message}</span>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('dobLabel')}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                    <input
                      type="date"
                      {...register('dateOfBirth')}
                      className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <span className="text-xs text-danger font-medium">{errors.dateOfBirth.message}</span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: Teacher Credentials (if role is teacher) */}
            {selectedRole === 'teacher' && (
              <div className="space-y-4 pt-4 border-t border-border/50 fade-in">
                <h3 className="text-sm font-extrabold text-primary flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {t('sectionTeacherInfo')}
                </h3>

                {/* Faculty */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('facultyLabel')}</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                    <input
                      type="text"
                      placeholder={t('facultyPlaceholder')}
                      {...register('faculty')}
                      className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                    />
                  </div>
                  {errors.faculty && (
                    <span className="text-xs text-danger font-medium">{errors.faculty.message}</span>
                  )}
                </div>

                {/* Department and Specialization */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Department */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t('departmentLabel')}</label>
                    <div className="relative">
                      <Bookmark className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                      <input
                        type="text"
                        placeholder={t('departmentPlaceholder')}
                        {...register('department')}
                        className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                      />
                    </div>
                    {errors.department && (
                      <span className="text-xs text-danger font-medium">{errors.department.message}</span>
                    )}
                  </div>

                  {/* Specialization */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t('specializationLabel')}</label>
                    <div className="relative">
                      <Bookmark className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                      <input
                        type="text"
                        placeholder={t('specializationPlaceholder')}
                        {...register('specialization')}
                        className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                      />
                    </div>
                    {errors.specialization && (
                      <span className="text-xs text-danger font-medium">{errors.specialization.message}</span>
                    )}
                  </div>
                </div>

                {/* Academic Title and Teacher Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Academic Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t('academicTitleLabel')}</label>
                    <div className="relative">
                      <Bookmark className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                      <input
                        type="text"
                        placeholder={t('academicTitlePlaceholder')}
                        {...register('academicTitle')}
                        className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                      />
                    </div>
                  </div>

                  {/* Teacher Code */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t('teacherCodeLabel')}</label>
                    <div className="relative">
                      <Bookmark className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                      <input
                        type="text"
                        placeholder={t('teacherCodePlaceholder')}
                        {...register('teacherCode')}
                        className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                      />
                    </div>
                  </div>
                </div>

                {/* Short Bio / Registration Reason */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('bioLabel')}</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                    <textarea
                      placeholder={t('bioPlaceholder')}
                      {...register('bio')}
                      rows={3}
                      className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground disabled:bg-primary/50 transition-colors rounded-xl text-sm font-bold shadow-lg shadow-primary/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('registerBtnLoading')}
                </>
              ) : (
                t('registerBtn')
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-xs text-muted-foreground pt-2">
            {t('hasAccount')}{' '}
            <Link href="/login" className="font-bold text-primary hover:text-primary/85 transition-colors">
              {t('signInNow')}
            </Link>
          </p>

    </div>
  );
}
