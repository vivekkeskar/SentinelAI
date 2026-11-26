import json

from backend.database.db import get_db_connection


def save_incident(logs, log_analysis, root_cause, solution, user_id, rag_sources=None):
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO incidents
            (logs, log_analysis, root_cause, solution, user_id, rag_sources)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (logs, log_analysis, root_cause, solution, user_id, json.dumps(rag_sources or []))
        )

        connection.commit()
        return cursor.lastrowid

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()


def get_all_incidents(user_id):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id, logs, created_at, rag_sources
            FROM incidents
            WHERE user_id = %s
            ORDER BY created_at DESC, id DESC
            """,
            (user_id,)
        )

        return [decode_rag_sources(row) for row in cursor.fetchall()]

    finally:
        cursor.close()
        connection.close()


def get_incident_by_id(incident_id, user_id):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id, logs, log_analysis, root_cause,
                   solution, created_at, user_id, rag_sources
            FROM incidents
            WHERE id = %s AND user_id = %s
            """,
            (incident_id, user_id)
        )

        return decode_rag_sources(cursor.fetchone())

    finally:
        cursor.close()
        connection.close()


def decode_rag_sources(row):
    if row is not None:
        sources = row.get('rag_sources')
        if isinstance(sources, str):
            sources = json.loads(sources)
        row['rag_sources'] = sources or []
    return row
