class StorageError(Exception):
    """Base exception for all storage operations."""
    pass


class FileTooLargeError(StorageError):
    """Raised when the uploaded file exceeds the configured maximum size limit."""
    pass


class InvalidStorageKeyError(StorageError):
    """Raised when the provided storage key is invalid or malformed."""
    pass


class StorageObjectNotFoundError(StorageError):
    """Raised when the specified storage object (file) does not exist."""
    pass
