from typing import BinaryIO, Generator, Optional


class BaseStorageProvider:
    """
    Abstract interface for file storage operations.
    Supports stream-based save/open to avoid loading entire files into memory.
    """

    def save_stream(self, file_obj: BinaryIO, storage_key: str, max_size_bytes: int) -> int:
        """
        Streams file content from file_obj to the storage target.
        Enforces max_size_bytes while streaming.
        Returns the total number of bytes written.
        Raises FileTooLargeError if the limit is exceeded.
        """
        raise NotImplementedError

    def open_stream(self, storage_key: str) -> Generator[bytes, None, None]:
        """
        Returns a generator yielding chunks of bytes from the storage object.
        Raises StorageObjectNotFoundError if the object does not exist.
        """
        raise NotImplementedError

    def delete(self, storage_key: str) -> None:
        """
        Permanently deletes the storage object.
        Handles missing files gracefully (no-op or log).
        """
        raise NotImplementedError

    def exists(self, storage_key: str) -> bool:
        """
        Checks if the storage object exists.
        """
        raise NotImplementedError

    def generate_download_url(self, storage_key: str, expires_in: int) -> Optional[str]:
        """
        Generates a temporary signed download URL (for cloud storage support).
        For local storage, this returns None.
        """
        raise NotImplementedError
