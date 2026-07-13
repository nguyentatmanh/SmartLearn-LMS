from typing import Optional
from app.core.config import settings
from app.storage.base import BaseStorageProvider
from app.storage.local import LocalStorageProvider
from app.storage.s3 import S3StorageProvider

_provider: Optional[BaseStorageProvider] = None


def get_storage_provider() -> BaseStorageProvider:
    """
    Factory function returning the configured storage provider.
    Instantiates provider lazily and caches it.
    """
    global _provider
    if _provider is None:
        backend = settings.STORAGE_BACKEND.lower()
        if backend == "local":
            _provider = LocalStorageProvider(upload_root=settings.UPLOAD_ROOT)
        elif backend == "s3":
            if not settings.S3_BUCKET:
                raise ValueError("S3_BUCKET configuration is required when STORAGE_BACKEND is 's3'")
            _provider = S3StorageProvider(
                bucket=settings.S3_BUCKET,
                endpoint_url=settings.S3_ENDPOINT
            )
        else:
            raise ValueError(f"Unknown storage backend: {settings.STORAGE_BACKEND}")
    return _provider
