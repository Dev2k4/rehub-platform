import hashlib
import logging
import uuid
from dataclasses import dataclass
from io import BytesIO

from PIL import Image, ImageOps
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.listing import ListingImage

logger = logging.getLogger(__name__)

_HASH_SIZE = 8
_HASH_BITS = _HASH_SIZE * _HASH_SIZE
_MAX_HAMMING_DISTANCE = 5


@dataclass(slots=True)
class DuplicateImageCheckResult:
    is_duplicate: bool
    perceptual_hash: str
    image_md5: str
    similarity_score: int = 0
    hamming_distance: int = 0
    duplicate_listing_id: uuid.UUID | None = None
    duplicate_image_id: uuid.UUID | None = None
    duplicate_image_url: str | None = None
    duplicate_thumbnail_url: str | None = None


class DuplicateImageService:
    @staticmethod
    def compute_hashes(image_bytes: bytes) -> tuple[str, str]:
        try:
            with Image.open(BytesIO(image_bytes)) as source_image:
                image = ImageOps.exif_transpose(source_image).convert("L")
                resized = image.resize((_HASH_SIZE + 1, _HASH_SIZE), Image.Resampling.LANCZOS)
                pixels = resized.load()

            hash_value = 0
            for row in range(_HASH_SIZE):
                for column in range(_HASH_SIZE):
                    left_pixel = pixels[column, row]
                    right_pixel = pixels[column + 1, row]
                    hash_value = (hash_value << 1) | int(left_pixel > right_pixel)

            perceptual_hash = f"{hash_value:016x}"
            image_md5 = hashlib.md5(image_bytes).hexdigest()
            return perceptual_hash, image_md5
        except Exception as exc:
            logger.exception("Failed to compute image hashes")
            raise ValueError("Invalid image file") from exc

    @staticmethod
    def hamming_distance(hash_one: str, hash_two: str) -> int:
        return (int(hash_one, 16) ^ int(hash_two, 16)).bit_count()

    @staticmethod
    def _similarity_score(distance: int) -> int:
        score = round(100 * (1 - (distance / _HASH_BITS)))
        return max(0, min(100, score))

    @staticmethod
    async def check_duplicate(
        db: AsyncSession,
        image_bytes: bytes,
    ) -> DuplicateImageCheckResult:
        perceptual_hash, image_md5 = DuplicateImageService.compute_hashes(image_bytes)

        exact_match_result = await db.execute(
            select(ListingImage).where(ListingImage.image_md5 == image_md5).limit(1)
        )
        exact_match = exact_match_result.scalar_one_or_none()
        if exact_match is not None:
            return DuplicateImageCheckResult(
                is_duplicate=True,
                perceptual_hash=perceptual_hash,
                image_md5=image_md5,
                similarity_score=100,
                hamming_distance=0,
                duplicate_listing_id=exact_match.listing_id,
                duplicate_image_id=exact_match.id,
                duplicate_image_url=exact_match.image_url,
                duplicate_thumbnail_url=exact_match.thumbnail_url,
            )

        candidate_result = await db.execute(
            select(ListingImage).where(ListingImage.perceptual_hash.is_not(None))
        )
        for candidate in candidate_result.scalars().all():
            candidate_hash = candidate.perceptual_hash
            if not candidate_hash:
                continue

            distance = DuplicateImageService.hamming_distance(perceptual_hash, candidate_hash)
            if distance <= _MAX_HAMMING_DISTANCE:
                return DuplicateImageCheckResult(
                    is_duplicate=True,
                    perceptual_hash=perceptual_hash,
                    image_md5=image_md5,
                    similarity_score=DuplicateImageService._similarity_score(distance),
                    hamming_distance=distance,
                    duplicate_listing_id=candidate.listing_id,
                    duplicate_image_id=candidate.id,
                    duplicate_image_url=candidate.image_url,
                    duplicate_thumbnail_url=candidate.thumbnail_url,
                )

        return DuplicateImageCheckResult(
            is_duplicate=False,
            perceptual_hash=perceptual_hash,
            image_md5=image_md5,
        )