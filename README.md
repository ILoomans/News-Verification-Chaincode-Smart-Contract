# News-Verification-Chaincode-Smart-Contract
Typescript chaincode for news verification on hyperledger fabric.

This solution is meant to run on a three node fabric network, using private data.

## Certificate Authorities

Node 1 and Node 2 will issue certificates to participating entities with the "institution" attribute.

## Node 1 News Organization

This node is responsible for introducing articles and their sources to the network. The article data itself will be encrypted and only shared to participants of Node 1 (News Organizations) & Node 2 (Verifiers).

## Node 2 Verifier Organization

This node is responsible for verifying or opposing sources, and explaining why they did so. They also have access to the articles.

## Node 3 Reader

This user only has access to read what is on the ledger, which articles are out there and who supports or opposes them. Because many news sites restrict access to articles (eg: through payment or disabling of adblocker), this node will not have access to the article data. They can however access the hash of the data, allowing them to verify that the article that they are reading is the same one verified on the ledger
