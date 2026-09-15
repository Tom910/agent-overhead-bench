# S3 preserve default-tool calibration boundary

Review found that calibration summary/attestation omitted raw compatibility
configuration. Reject configured C4 records at both boundaries so private
recovery results cannot qualify default-tool calibration. Offline regressions
exercise raw configured inputs, including otherwise valid attestation hashes.
