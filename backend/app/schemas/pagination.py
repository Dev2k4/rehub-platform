from typing import Generic, TypeVar, Optional, List
from pydantic import BaseModel

T = TypeVar('T')

class PaginatedResult(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
