from typing import BinaryIO, Generator, Optional
from app.storage.base import BaseStorageProvider


class S3StorageProvider(BaseStorageProvider):
    """
    Skeleton S3 Storage Provider.
    Explicitly raises NotImplementedError to prevent silent fallback.
    """

    def __init__(self, bucket: str, endpoint_url: Optional[str] = None):
        self.bucket = bucket
        self.endpoint_url = endpoint_url

    def save_stream(self, file_obj: BinaryIO, storage_key: str, max_size_bytes: int) -> int:
        raise NotImplementedError("S3StorageProvider is not implemented yet")

    def open_stream(self, storage_key: str) -> Generator[bytes, None, None]:
        raise NotImplementedError("S3StorageProvider is not implemented yet")

    def delete(self, storage_key: str) -> None:
        raise NotImplementedError("S3StorageProvider is not implemented yet")

    def exists(self, storage_key: str) -> bool:
        raise NotImplementedError("S3StorageProvider is not implemented yet")

    def generate_download_url(self, storage_key: str, expires_in: int) -> Optional[str]:
        raise NotImplementedError("S3StorageProvider is not implemented yet")
