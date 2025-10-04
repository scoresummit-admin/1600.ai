import json
import os
from flask import Flask, request, jsonify
import urllib.request
import urllib.error

app = Flask(__name__)


@app.post("/")
@app.post("/api/openai/responses")
def proxy_openai_responses():
    """Proxy requests to the OpenAI Responses API to avoid CORS issues."""

    api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('VITE_OPENAI_API_KEY')
    if not api_key:
        return jsonify({"error": "OpenAI API key not configured"}), 500

    try:
        request_data = request.get_json()
        if not request_data:
            return jsonify({"error": "No request data provided"}), 400

        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

        organization = os.environ.get('OPENAI_ORGANIZATION')
        project = os.environ.get('OPENAI_PROJECT')

        if organization:
            headers['OpenAI-Organization'] = organization
        if project:
            headers['OpenAI-Project'] = project

        data = json.dumps(request_data).encode('utf-8')
        req = urllib.request.Request(
            'https://api.openai.com/v1/responses',
            data=data,
            headers=headers,
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=60) as response:
            response_data = json.loads(response.read().decode('utf-8'))

        return jsonify(response_data)

    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else 'Unknown error'
        return jsonify({
            "error": f"OpenAI API error: {e.code} {e.reason}",
            "details": error_body
        }), e.code
    except urllib.error.URLError as e:
        return jsonify({
            "error": f"Network error: {str(e)}"
        }), 503
    except json.JSONDecodeError as e:
        return jsonify({
            "error": f"Invalid JSON in response: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "error": f"Unexpected error: {str(e)}"
        }), 500
