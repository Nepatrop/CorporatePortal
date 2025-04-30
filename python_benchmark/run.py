import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8083,
        workers=4,
        reload=True,
        loop="uvloop"
    )
