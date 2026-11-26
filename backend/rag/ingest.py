from pathlib import Path
import hashlib

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings

BASE_DIR = Path(__file__).resolve().parents[2]
DOCUMENTS_DIR = BASE_DIR / "data" / "documents"
CHROMA_PATH = BASE_DIR / "data" / "chroma_db"

def main():
    files = sorted(DOCUMENTS_DIR.glob("*.txt"))

    if not files:
        print("No documents found!")
        return

    documents = []

    for file in files:
        content = file.read_text(encoding="utf-8").strip()

        if content:
            documents.append(
                Document(
                    page_content=content,
                    metadata={"source": file.name}
                )
            )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=700,
        chunk_overlap=120
    )

    chunks = splitter.split_documents(documents)

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vectorstore = Chroma(
        collection_name="sentinelai_docs",
        embedding_function=embeddings,
        persist_directory=str(CHROMA_PATH)
    )

    # Update only the documents managed by this ingestion script.
    sources = {file.name for file in files}

    for source in sources:
        existing = vectorstore.get(
            where={"source": source},
            include=[]
        )

        if existing["ids"]:
            vectorstore.delete(ids=existing["ids"])

    ids = [
        hashlib.sha256(
            f"{chunk.metadata['source']}:{i}:{chunk.page_content}".encode()
        ).hexdigest()
        for i, chunk in enumerate(chunks)
    ]

    if chunks:
        vectorstore.add_documents(chunks, ids=ids)

    print(f"Documents loaded: {len(documents)}")
    print(f"Chunks stored: {len(chunks)}")
    print("RAG knowledge base updated successfully!")

if __name__ == "__main__":
    main()
