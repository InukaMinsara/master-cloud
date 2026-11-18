# MASTER CLOUD DEDICATED GPU ENGINE — GOOGLE COLAB ONE-CLICK LAUNCHER
# Run this single cell in Google Colab (Runtime -> Change runtime type -> T4 GPU)

!pip install fastapi uvicorn python-multipart pydantic pillow gradio_client pyngrok pycloudflared

import os
import subprocess
import time

# 1. Download Master Cloud Backend
backend_code = '''
import os
import sys
import io
import time
import base64
import torch
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

app = FastAPI(title="Master Cloud Dedicated GPU Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
GPU_NAME = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
TOTAL_VRAM = round(torch.cuda.get_device_properties(0).total_memory / (1024 ** 3), 2) if torch.cuda.is_available() else 0

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "online": True,
        "device": DEVICE,
        "gpu": GPU_NAME,
        "total_vram_gb": TOTAL_VRAM
    }

@app.post("/api/v1/tryon")
async def tryon(
    person_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    description: Optional[str] = Form("A fashionable outfit")
):
    try:
        from gradio_client import Client, handle_file
        temp_p = "/tmp/person.jpg"
        temp_g = "/tmp/garment.jpg"
        with open(temp_p, "wb") as f: f.write(await person_image.read())
        with open(temp_g, "wb") as f: f.write(await garment_image.read())

        client = Client("yisol/IDM-VTON")
        res = client.predict(
            dict={"background": handle_file(temp_p), "layers": [], "composite": None},
            garm_img=handle_file(temp_g),
            garment_des=description,
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=30,
            seed=42,
            api_name="/tryon"
        )
        with open(res[0], "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        return {"success": True, "image_data": f"data:image/png;base64,{b64}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
'''

with open("master_backend.py", "w") as f:
    f.write(backend_code)

# 2. Start Uvicorn in background
import subprocess
server_process = subprocess.Popen(["uvicorn", "master_backend:app", "--host", "0.0.0.0", "--port", "8000"])
time.sleep(3)

# 3. Create Free Cloudflare Tunnel
from pycloudflared import try_cloudflare
public_url = try_cloudflare(port=8000)
print("\n" + "=" * 65)
print("  🚀 MASTER CLOUD DEDICATED GPU BACKEND IS LIVE!")
print(f"  ⚡ Public Tunnel URL: {public_url.tunnel_url}")
print("  👉 Copy this URL into Master Cloud AI Studio settings!")
print("=" * 65 + "\n")
