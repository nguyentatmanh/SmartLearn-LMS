import os
from typing import BinaryIO, Generator, Optional
from app.storage.base import BaseStorageProvider
from app.storage.exceptions import FileTooLargeError, StorageObjectNotFoundError


class LocalStorageProvider(BaseStorageProvider):
    """
    Local storage provider that streams file contents to and from the local filesystem.
    Configured with a root directory. Resolves keys safely to prevent path traversal.
    """

    def __init__(self, upload_root: str):
        self.upload_root = os.path.abspath(upload_root)

    def _resolve_path(self, storage_key: str) -> str:
        # Resolve target path and verify it lies inside the upload root directory
        safe_path = os.path.abspath(os.path.join(self.upload_root, storage_key))
        if not safe_path.startswith(self.upload_root):
            raise ValueError("Directory traversal attempt detected")
        return safe_path

    def save_stream(self, file_obj: BinaryIO, storage_key: str, max_size_bytes: int) -> int:
        target_path = self._resolve_path(storage_key)
        os.makedirs(os.path.dirname(target_path), exist_ok=True)

        bytes_written = 0
        chunk_size = 1024 * 1024  # 1 MB chunk size

        try:
            with open(target_path, "wb") as f:
                while True:
                    chunk = file_obj.read(chunk_size)
                    if not chunk:
                        break
                    
                    bytes_written += len(chunk)
                    if bytes_written > max_size_bytes:
                        f.close()
                        if os.path.exists(target_path):
                            os.remove(target_path)
                        raise FileTooLargeError(
                            f"File exceeds maximum allowed size of {max_size_bytes} bytes"
                        )
                    
                    f.write(chunk)
        except Exception as e:
            if not isinstance(e, FileTooLargeError) and os.path.exists(target_path):
                try:
                    os.remove(target_path)
                except OSError:
                    pass
            raise e

        return bytes_written

    def open_stream(self, storage_key: str) -> Generator[bytes, None, None]:
        target_path = self._resolve_path(storage_key)
        if not os.path.exists(target_path):
            raise StorageObjectNotFoundError(f"File not found: {storage_key}")

        chunk_size = 1024 * 1024  # 1 MB chunk size
        with open(target_path, "rb") as f:
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                yield chunk

    def delete(self, storage_key: str) -> None:
        try:
            target_path = self._resolve_path(storage_key)
            if os.path.exists(target_path):
                os.remove(target_path)
        except Exception:
            pass

    def exists(self, storage_key: str) -> bool:
        try:
            target_path = self._resolve_path(storage_key)
            return os.path.exists(target_path)
        except Exception:
            return False

    def generate_download_url(self, storage_key: str, expires_in: int) -> Optional[str]:
        return None
