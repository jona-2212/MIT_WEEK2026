import pytest

from app.services.knowledge.chroma_store import (
    export_chroma_index,
    initialize_chroma,
    local_client,
    sync_index_to_chroma,
)
from app.services.knowledge.static_index import StaticKnowledgeRetriever, verify_index

pytestmark = pytest.mark.anyio


@pytest.fixture(autouse=True)
def stop_chroma_systems():
    yield
    # SDK tidak menyediakan close publik untuk PersistentClient. Cleanup hanya di tes.
    from chromadb.api.shared_system_client import SharedSystemClient

    for system in list(SharedSystemClient._identifier_to_system.values()):
        system.stop()
    SharedSystemClient.clear_system_cache()


async def test_chroma_init_is_empty_without_an_embedding_function(tmp_path) -> None:
    report = initialize_chroma(tmp_path / "chroma")
    assert report["records"] == 0 and report["embedding_api_calls"] == 0
    client = local_client(tmp_path / "chroma")
    assert client.get_settings().anonymized_telemetry is False
    assert client.get_settings().allow_reset is False


async def test_chroma_roundtrip_to_read_only_json_and_real_query(rag_bundle, tmp_path) -> None:
    settings, embeddings = rag_bundle
    database = tmp_path / "chroma"
    first = sync_index_to_chroma(
        settings.legal_index_path, settings.legal_registry_path, database, allow_test=True
    )
    second = sync_index_to_chroma(
        settings.legal_index_path, settings.legal_registry_path, database, allow_test=True
    )
    assert first == second and first["records"] == 3 and first["embedding_api_calls"] == 0
    collection = local_client(database).get_collection(first["collection"], embedding_function=None)
    result = collection.query(
        query_embeddings=[await embeddings.embed_query("biaya transfer")],
        n_results=1,
        include=["documents", "metadatas", "distances"],
    )
    assert "biaya" in result["documents"][0][0]
    assert result["metadatas"][0][0]["page_start"] == 1
    assert result["distances"][0][0] == pytest.approx(0, abs=1e-6)
    output = tmp_path / "exported"
    report = export_chroma_index(
        database, first["collection"], output, settings.legal_registry_path, allow_test=True
    )
    assert report["status"] == "exported_verified" and report["chunks"] == 3
    verify_index(output, settings.legal_registry_path, allow_test=True)
    settings.legal_index_path = output
    screened = await StaticKnowledgeRetriever(settings, embeddings).retrieve(
        "biaya", {"recruitment_fees"}
    )
    assert screened.status == "needs_more_context" and screened.references


async def test_mock_chroma_never_enters_official_collection(rag_bundle, tmp_path) -> None:
    settings, _ = rag_bundle
    with pytest.raises(ValueError, match="chroma_fixture_collection_forbidden"):
        sync_index_to_chroma(
            settings.legal_index_path,
            settings.legal_registry_path,
            tmp_path / "chroma",
            allow_test=True,
            collection_name="jeli-legal-official",
        )


async def test_chroma_export_rejects_unindexed_collection_without_writing(tmp_path) -> None:
    initialize_chroma(tmp_path / "chroma")
    with pytest.raises(ValueError, match="chroma_collection_not_indexed"):
        export_chroma_index(
            tmp_path / "chroma",
            "jeli-legal-official",
            tmp_path / "exported",
            tmp_path / "registry.json",
        )
    assert not (tmp_path / "exported").exists()
