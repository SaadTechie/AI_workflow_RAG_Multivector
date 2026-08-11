import io
import base64
from datetime import timedelta
from typing import Optional
from minio import Minio
from minio.error import S3Error

from ..config import settings


class MinIOClient:
    def __init__(self):
        # Nettoyage de l'endpoint (retire http:// ou https://)
        endpoint = settings.MINIO_ENDPOINT.replace("http://", "").replace("https://", "")
        
        # 🟢 Conversion explicite de la chaîne ".env" en booléen Python
        if isinstance(settings.MINIO_SECURE, str):
            is_secure = settings.MINIO_SECURE.lower() in ("true", "1", "yes")
        else:
            is_secure = bool(settings.MINIO_SECURE)

        self.client = Minio(
            endpoint=endpoint,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=is_secure  # Doit valoir False en local
        )
        self._public_client = Minio(
            endpoint=settings.MINIO_PUBLIC_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket_name = settings.MINIO_BUCKET
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self) -> None:
        """Vérifie l'existence du bucket et le crée si nécessaire."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
        except S3Error as err:
            raise RuntimeError(f"Erreur d'initialisation MinIO: {err}")

    def upload_bytes(
        self,
        data: bytes,
        object_name: str,
        content_type: str = "application/octet-stream"
    ) -> str:
        """Enregistre des octets bruts (ex: PDF, PPTX) dans le bucket."""
        data_stream = io.BytesIO(data)
        self.client.put_object(
            bucket_name=self.bucket_name,
            object_name=object_name,
            data=data_stream,
            length=len(data),
            content_type=content_type,
        )
        return object_name

    def upload_base64_image(self, b64_string: str, object_name: str, content_type: str = "image/png"):
        """Décode la chaîne Base64 et l'envoie dans MinIO avec son type MIME réel."""
        img_data = base64.b64decode(b64_string)
        self.client.put_object(
            bucket_name=self.bucket_name,
            object_name=object_name,
            data=io.BytesIO(img_data),
            length=len(img_data),
            content_type=content_type
        )

    def get_presigned_url(self, object_name: str, expires_hours: int = 12) -> str:
        return self._public_client.presigned_get_object(
            bucket_name=self.bucket_name, object_name=object_name,
            expires=timedelta(hours=expires_hours),
        )


minio_client = MinIOClient()