import os
from fastapi import APIRouter, HTTPException, UploadFile, File
from azure.storage.blob import BlobServiceClient, ContentSettings

router = APIRouter()

# ENV
AZURE_STORAGE_CONN_STR = os.getenv("AZURE_STORAGE_CONN_STR")
AZURE_CONTAINER_NAME = os.getenv("AZURE_CONTAINER") or os.getenv(
    "AZURE_CONTAINER_NAME", "uploads"
)
AZURE_STORAGE_ACCOUNT = os.getenv("AZURE_STORAGE_ACCOUNT")  # for building public URL


def _get_container_client():
    if not AZURE_STORAGE_CONN_STR:
        raise HTTPException(
            status_code=500, detail="storage connection string not configured"
        )
    try:
        bsc = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONN_STR)
        container = bsc.get_container_client(AZURE_CONTAINER_NAME)
        try:
            container.create_container()
        except Exception:
            pass
        return container
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"blob client error: {e}")


@router.post("", tags=["voc"])
async def upload_voc(file: UploadFile = File(...)):
    """Direct upload endpoint for VOC files (server-side upload using connection string).
    Accepts multipart/form-data with field name 'file'.
    Constraints: filename must include '_voc' and end with .pdf or .txt
    Returns: { fileUrl }
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="file is required")

    filename = file.filename
    lower = filename.lower()
    if ("_voc" not in lower) or (
        not (lower.endswith(".pdf") or lower.endswith(".txt"))
    ):
        raise HTTPException(
            status_code=400,
            detail="filename must include _voc and end with .pdf or .txt",
        )

    container = _get_container_client()

    try:
        data = await file.read()
        content_type = "text/plain" if lower.endswith(".txt") else "application/pdf"
        blob = container.get_blob_client(filename)
        blob.upload_blob(
            data,
            overwrite=True,
            content_settings=ContentSettings(content_type=content_type),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"upload failed: {e}")
    finally:
        await file.close()

    if not AZURE_STORAGE_ACCOUNT:
        # build from container client url as fallback
        try:
            file_url = f"{blob.url}"
        except Exception:
            raise HTTPException(
                status_code=500, detail="AZURE_STORAGE_ACCOUNT not configured"
            )
    else:
        file_url = f"https://{AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/{AZURE_CONTAINER_NAME}/{filename}"

    return {"fileUrl": file_url}
