from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from app import activities, app


@pytest.fixture(autouse=True)
def restore_activities():
    original = deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)


@pytest.fixture
def client():
    return TestClient(app)


def test_signup_requires_teacher_login(client):
    response = client.post(
        "/activities/Chess Club/signup",
        params={"email": "newstudent@mergington.edu"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Teacher login required"


def test_teacher_can_log_in_and_manage_registrations(client):
    login_response = client.post(
        "/auth/login",
        json={"username": "coach.miller", "password": "mergington123"},
    )
    assert login_response.status_code == 200

    signup_response = client.post(
        "/activities/Chess Club/signup",
        params={"email": "newstudent@mergington.edu"},
    )
    assert signup_response.status_code == 200
    assert "newstudent@mergington.edu" in activities["Chess Club"]["participants"]

    unregister_response = client.delete(
        "/activities/Chess Club/unregister",
        params={"email": "newstudent@mergington.edu"},
    )
    assert unregister_response.status_code == 200
    assert "newstudent@mergington.edu" not in activities["Chess Club"]["participants"]
