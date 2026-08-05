from gltest import get_contract_factory, create_account
from gltest.assertions import tx_execution_succeeded


def test_disputatio_full_lifecycle():
    # Deploy Disputatio contract
    factory = get_contract_factory("Disputatio")
    contract = factory.deploy(args=[])
    
    # Create test accounts
    proponent = create_account()
    opponent = create_account()
    
    # 0.05 GEN fee represented in Wei
    fee_wei = 50000000000000000
    
    # 1. Proponent raises a Quaestio (Topic + Thesis) with 0.05 GEN fee passed to transact
    rc_propose = contract.connect(proponent).raise_quaestio(
        args=[
            "Determinism vs Free Will",
            "Human agency possesses authentic free will, enabling morally accountable choice."
        ]
    ).transact(value=fee_wei)
    assert tx_execution_succeeded(rc_propose)
    
    # Check that Quaestio was stored
    quaestiones = contract.get_quaestiones(args=[0]).call()
    assert len(quaestiones) == 1
    quaestio_id = quaestiones[0]["id"]
    assert quaestio_id == "Q1"
    assert quaestiones[0]["claim"] == "Human agency possesses authentic free will, enabling morally accountable choice."
    
    # 2. Opponent challenges with an Antithesis (paying 0.05 GEN fee passed to transact)
    rc_challenge = contract.connect(opponent).dispute_thesis(
        args=[
            quaestio_id,
            "Free will is an illusion; all human actions are predetermined by material causality."
        ]
    ).transact(value=fee_wei)
    assert tx_execution_succeeded(rc_challenge)
    
    # Check updated stats
    stats = contract.get_disputatio_stats(args=[]).call()
    assert int(stats["arenas"]) == 1
    assert int(stats["debates"]) == 1
    assert stats["accumulated_fees"] == str(fee_wei * 2)
    
    # 3. Owner withdraws the accumulated fees
    # Note: contract deployer is the default sender of factory.deploy, i.e., owner
    rc_withdraw = contract.withdraw_fees().transact()
    assert tx_execution_succeeded(rc_withdraw)
    
    # Verify fees reset
    stats_post = contract.get_disputatio_stats(args=[]).call()
    assert stats_post["accumulated_fees"] == "0"


def test_judgment_parser_threshold_consistency():
    import sys
    from pathlib import Path
    contract_dir = str(Path(__file__).parent.parent.parent / "contracts")
    if contract_dir not in sys.path:
        sys.path.insert(0, contract_dir)
        
    from disputatio import _parse_judgment
    import pytest
    
    # 1. Valid DEFEND (margin < 60)
    res_defend = _parse_judgment('{"verdict": "DEFEND", "margin": 15, "note": "valid defend"}')
    assert res_defend["verdict"] == "DEFEND"
    assert res_defend["margin"] == 15
    
    # 2. Valid OVERTHROW (margin >= 60)
    res_overthrow = _parse_judgment('{"verdict": "OVERTHROW", "margin": 72, "note": "valid overthrow"}')
    assert res_overthrow["verdict"] == "OVERTHROW"
    assert res_overthrow["margin"] == 72
    
    # 3. Contradictory: OVERTHROW but margin < 60
    with pytest.raises(Exception) as exc_info:
        _parse_judgment('{"verdict": "OVERTHROW", "margin": 45, "note": "contradictory overthrow"}')
    assert "[CONVERGENCE_FAIL] Contradictory outcome" in str(exc_info.value)
    
    # 4. Contradictory: DEFEND but margin >= 60
    with pytest.raises(Exception) as exc_info:
        _parse_judgment('{"verdict": "DEFEND", "margin": 65, "note": "contradictory defend"}')
    assert "[CONVERGENCE_FAIL] Contradictory outcome" in str(exc_info.value)

