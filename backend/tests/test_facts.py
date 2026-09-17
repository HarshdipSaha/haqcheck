import pytest
from haqcheck.facts import validate_facts, build_entities, ValidationError

GOOD = {"state": "KA", "daysWorkedLast12m": 73, "eshramRegistered": True,
        "platforms": ["zomato", "swiggy"], "vehicle": "two_wheeler", "age": 24}


def test_valid_facts_pass_through_normalised():
    f = validate_facts({**GOOD, "state": "ka", "platforms": ["Zomato", "swiggy"]})
    assert f["state"] == "KA"
    assert f["platforms"] == ["swiggy", "zomato"]   # lowercased, de-duplicated, sorted


@pytest.mark.parametrize("bad,field", [
    ({**GOOD, "daysWorkedLast12m": 400}, "daysWorkedLast12m"),
    ({**GOOD, "daysWorkedLast12m": -1}, "daysWorkedLast12m"),
    ({**GOOD, "age": 17}, "age"),
    ({**GOOD, "state": "XX"}, "state"),
    ({**GOOD, "vehicle": "rocket"}, "vehicle"),
    ({**GOOD, "eshramRegistered": "yes"}, "eshramRegistered"),
    ({k: v for k, v in GOOD.items() if k != "platforms"}, "platforms"),
])
def test_invalid_facts_report_field(bad, field):
    with pytest.raises(ValidationError) as e:
        validate_facts(bad)
    assert field in e.value.errors


def test_build_entities_shapes_avp_entity_list():
    ents = build_entities("case-1", GOOD, "ka_welfare_fund")
    worker = ents[0]
    assert worker["identifier"] == {"entityType": "HaqCheck::Worker", "entityId": "case-1"}
    assert worker["attributes"]["daysWorkedLast12m"] == {"long": 73}
    assert worker["attributes"]["eshramRegistered"] == {"boolean": True}
    assert worker["attributes"]["platforms"] == {"set": [{"string": "zomato"}, {"string": "swiggy"}]}
    benefit = ents[1]
    assert benefit["identifier"] == {"entityType": "HaqCheck::Benefit", "entityId": "ka_welfare_fund"}
    assert benefit["attributes"]["name"]["string"]
