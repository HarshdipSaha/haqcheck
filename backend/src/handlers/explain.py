from haqcheck.explain import explain_results
from haqcheck.http import parse_body, respond

LANGS = {"en", "hi", "kn"}


def lambda_handler(event, context):
    try:
        body = parse_body(event)
    except ValueError:
        return respond(400, {"error": "invalid_json"})
    results = body.get("results")
    language = body.get("language", "en")
    if not isinstance(results, list) or not results or language not in LANGS:
        return respond(400, {"error": "bad_request"})
    for r in results:
        if not {"benefitId", "verdict"} <= set(r):
            return respond(400, {"error": "bad_result_shape"})
    return respond(200, {"explanations": explain_results(results, language)})
