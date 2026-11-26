from langchain_core.embeddings import Embeddings
from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2


class LightweightEmbeddings(Embeddings):

    def __init__(self):
        self.model = ONNXMiniLM_L6_V2(
            preferred_providers=["CPUExecutionProvider"]
        )

    def embed_documents(self, texts):
        return [
            vector.tolist()
            for vector in self.model(texts)
        ]

    def embed_query(self, text):
        return self.embed_documents([text])[0]
