from pathlib import Path

from langchain_chroma import Chroma
from backend.rag.embeddings import LightweightEmbeddings

BASE_DIR = Path(__file__).resolve().parents[2]
CHROMA_PATH = BASE_DIR / "data/chroma_db"

embeddings = LightweightEmbeddings()

vectorstore = Chroma(
    collection_name="sentinelai_docs",
    embedding_function=embeddings,
    persist_directory=str(CHROMA_PATH)
)


def retrieve_documents(query, k=5, threshold=0.55):
    """
    Retrieve relevant documents using distance-based filtering.
    Lower distance means better semantic similarity.
    """

    results = vectorstore.similarity_search_with_score(
        query,
        k=k
    )

    if not results:
        return []

    # Find the best matching chunk for each source.
    best_by_source = {}

    for doc, distance in results:
        source = doc.metadata.get("source", "unknown")

        if (
            source not in best_by_source
            or distance < best_by_source[source][1]
        ):
            best_by_source[source] = (doc, distance)

    ranked = sorted(
        best_by_source.values(),
        key=lambda item: item[1]
    )

    best_doc, best_distance = ranked[0]

    # Strong semantic match
    if best_distance <= threshold:
        return [best_doc]

    # Moderate match: require a clear gap to the next source.
    if best_distance <= 0.80 and len(ranked) > 1:
        second_distance = ranked[1][1]

        if second_distance - best_distance >= 0.20:
            return [best_doc]

    return []
