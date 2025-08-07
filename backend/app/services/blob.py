import os, asyncio, datetime as dt
from dotenv import load_dotenv
from azure.storage.blob.aio import ContainerClient
from azure.storage.blob import ContentSettings

_CONTAINER = os.getenv("AZURE_CONTAINER_NAME")

load_dotenv()


class BlobService:
    def __init__(self):
        self.client = ContainerClient.from_connection_string(
            os.getenv("AZURE_STORAGE_CONN_STR"), container_name=_CONTAINER
        )

    async def upload_pdf(self, local_path: str, blob_name: str):
        async with self.client:
            with open(local_path, "rb") as f:
                await self.client.upload_blob(
                    name=blob_name,
                    data=f,
                    overwrite=True,
                    content_settings=ContentSettings(content_type="application/pdf"),
                )

    async def latest_pdf(self):
        async with self.client:
            latest = None
            async for b in self.client.list_blobs(name_starts_with=""):
                if b.name.endswith(".pdf"):
                    if not latest or b.last_modified > latest.last_modified:
                        latest = b
            return latest  # BlobProperties
