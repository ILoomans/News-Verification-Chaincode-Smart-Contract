/*
 * SPDX-License-Identifier: Apache-2.0
 */

// First we need assure updateSources can only be called inside the class
// Second we need to view the private asset

// verify the asset
import crypto = require("crypto");
import {
    Context,
    Contract,
    Info,
    Returns,
    Transaction,
} from "fabric-contract-api";
import { ClientIdentity } from "fabric-shim";
import { Source } from "./source";
import { MyPrivateAsset } from "./my-private-asset";
import { ArticleMeta } from "./ArticleMeta";
import { PrivateArticle } from "./PrivateArticle";

async function getCollectionName(ctx: Context): Promise<string> {
    const mspid: string = ctx.clientIdentity.getMSPID();
    const collectionName: string = `_implicit_org_${mspid}`;
    return collectionName;
}

@Info({
    title: "MyPrivateAssetContract",
    description: "My Private Data Smart Contract",
})
export class MyPrivateAssetContract extends Contract {
    @Transaction(true)
    public async addSource(
        ctx: Context,
        sourceId: string,
        name: string,
        location: string,
        data: string
    ): Promise<void> {
        const identity: ClientIdentity = ctx.clientIdentity;
        if (parseInt(sourceId) < 100000) {
            const checkAttr: boolean = identity.getMSPID() == "Org1MSP";
            const introducer = identity.getAttributeValue("institution");

            if (checkAttr && introducer) {
                const exists = await this.sourceExists(ctx, sourceId);
                if (exists) {
                    throw new Error(`The source ${sourceId} already exists`);
                }
                const no = new Source();
                no.name = name;
                no.verificationStatus = false;
                no.initialVerifier = "";
                no.time = Math.round(+new Date() / 1000).toString();
                no.introducer = introducer;
                no.uses = [];
                no.objections = [];
                no.support = [];
                no.location = location;
                no.data = data;
                const buffer = Buffer.from(JSON.stringify(no));
                await ctx.stub.putState(sourceId, buffer);
            } else {
                throw new Error(
                    "You must be host node to carry out this transaction!"
                );
            }
        } else {
            throw new Error("The range of sources id is greater then 100000");
        }
    }

    // @Transaction(false)
    // @Returns('string')
    // public async getAllSources(ctx: Context): Promise<string> {
    //     const allResults = [];
    //     // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
    //     const iterator = await ctx.stub.getStateByRange('0', '100000');
    //     let result = await iterator.next();
    //     while (!result.done) {
    //         const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
    //         let record;
    //         try {
    //             record = JSON.parse(strValue);
    //         } catch (err) {
    //             console.log(err);
    //             record = strValue;
    //         }
    //         allResults.push({Key: result.value.key, Record: record});
    //         result = await iterator.next();
    //     }
    //     return JSON.stringify(allResults);
    // }

    @Transaction(false)
    public async getAllSources(ctx: Context): Promise<string> {
        const iterator = await ctx.stub.getStateByRange("", "");
        const allResults = [];
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString());

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString());
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString();
                }
                if (parseInt(Key) < 100000) {
                    allResults.push({ Key, Record });
                }
            }
            if (res.done) {
                console.log("end of data");
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    @Transaction(false)
    public async getAllArticles(ctx: Context): Promise<string> {
        const iterator = await ctx.stub.getStateByRange("", "");
        const allResults = [];
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString());

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString());
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString();
                }
                if (parseInt(Key) >= 100000) {
                    allResults.push({ Key, Record });
                }
            }
            if (res.done) {
                console.log("end of data");
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }
    // @Transaction(false)
    // @Returns('string')
    // public async getAllArticles(ctx: Context): Promise<string> {
    //     const allResults = [];
    //     // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
    //     const iterator = await ctx.stub.getStateByRange('100000', '99999999999');
    //     let result = await iterator.next();
    //     while (!result.done) {
    //         const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
    //         let record;
    //         try {
    //             record = JSON.parse(strValue);
    //         } catch (err) {
    //             console.log(err);
    //             record = strValue;
    //         }
    //         allResults.push({Key: result.value.key, Record: record});
    //         result = await iterator.next();
    //     }
    //     return JSON.stringify(allResults);
    // }

    @Transaction(true)
    @Returns("Sources")
    private async updateSourceUses(
        ctx: Context,
        sourceId: string,
        articleId: string
    ): Promise<void> {
        const exists: boolean = await this.sourceExists(ctx, sourceId);
        if (!exists) {
            throw new Error(`The sources ${sourceId} does not exist`);
        }
        const data: Uint8Array = await ctx.stub.getState(sourceId);
        let sources: Source = JSON.parse(data.toString()) as Source;
        console.log("Sources", sources);
        sources.uses.push(articleId);
        const buffer = Buffer.from(JSON.stringify(sources));
        await ctx.stub.putState(sourceId, buffer);
    }

    @Transaction(true)
    @Returns("Sources")
    public async verifySource(
        ctx: Context,
        sourceId: string,
        justification: string
    ): Promise<void> {
        const exists: boolean = await this.sourceExists(ctx, sourceId);
        if (!exists) {
            throw new Error(`The sources ${sourceId} does not exist`);
        }
        const identity: ClientIdentity = ctx.clientIdentity;
        const initialVerifier = identity.getAttributeValue("institution");
        const checkAttr: boolean = identity.getMSPID() == "Org2MSP";
        if (!checkAttr && !initialVerifier) {
            throw new Error(
                "You do not have the adequate credentials update sources, You have to be a verifier registered to Org2 and have an institution credential"
            );
        }
        const data: Uint8Array = await ctx.stub.getState(sourceId);
        let sources: Source = JSON.parse(data.toString()) as Source;
        sources.support.map((val) => {
            if (val[0] == initialVerifier) {
                throw new Error("You have already verified this source");
            }
        });
        if (!sources.initialVerifier) {
            sources.initialVerifier = initialVerifier;
        }
        const institution = initialVerifier;
        sources.support.push({ institution, justification });
        sources.verificationStatus = true;
        const buffer = Buffer.from(JSON.stringify(sources));
        await ctx.stub.putState(sourceId, buffer);
    }

    @Transaction(true)
    @Returns("Sources")
    public async objectSource(
        ctx: Context,
        sourceId: string,
        justification: string
    ): Promise<void> {
        const exists: boolean = await this.sourceExists(ctx, sourceId);
        if (!exists) {
            throw new Error(`The sources ${sourceId} does not exist`);
        }
        const identity: ClientIdentity = ctx.clientIdentity;
        const initialVerifier = identity.getAttributeValue("institution");
        const checkAttr: boolean = identity.getMSPID() == "Org2MSP";
        if (!checkAttr && !initialVerifier) {
            throw new Error(
                "You do not have the adequate credentials update sources, You have to be a verifier registered to Org2 and have an institution credential"
            );
        }
        const data: Uint8Array = await ctx.stub.getState(sourceId);
        let sources: Source = JSON.parse(data.toString()) as Source;
        sources.objections.map((val) => {
            if (val[0] == initialVerifier) {
                throw new Error("You have already verified this source");
            }
        });
        if (!sources.initialVerifier) {
            sources.initialVerifier = initialVerifier;
        }
        const institution = initialVerifier;
        sources.objections.push({ institution, justification });
        sources.verificationStatus = true;
        const buffer = Buffer.from(JSON.stringify(sources));
        await ctx.stub.putState(sourceId, buffer);
    }

    @Transaction(false)
    @Returns("Sources")
    public async readSources(ctx: Context, sourceId: string): Promise<Source> {
        const exists: boolean = await this.sourceExists(ctx, sourceId);
        if (!exists) {
            throw new Error(`The sources ${sourceId} does not exist`);
        }
        const data: Uint8Array = await ctx.stub.getState(sourceId);
        const sources: Source = JSON.parse(data.toString()) as Source;
        return sources;
    }

    @Transaction(false)
    @Returns("boolean")
    public async sourceExists(
        ctx: Context,
        sourcesId: string
    ): Promise<boolean> {
        const data: Uint8Array = await ctx.stub.getState(sourcesId);
        return !!data && data.length > 0;
    }

    @Transaction(false)
    @Returns("Array")
    public viewOrg(ctx: Context): Array<string> {
        const identity: ClientIdentity = ctx.clientIdentity;
        return [identity.getMSPID(), identity.getAttributeValue("institution")];
    }

    @Transaction(false)
    @Returns("boolean")
    public async myPrivateAssetExists(
        ctx: Context,
        myPrivateAssetId: string
    ): Promise<boolean> {
        const collectionName: string = await getCollectionName(ctx);
        const data: Uint8Array = await ctx.stub.getPrivateDataHash(
            collectionName,
            myPrivateAssetId
        );
        return !!data && data.length > 0;
    }

    @Transaction()
    public async addArticle(
        ctx: Context,
        myPrivateAssetId: string,
        author: string,
        title: string,
        sources: string
    ): Promise<void> {
        // Check that its org2
        if (parseInt(myPrivateAssetId) < 100000) {
            throw new Error("Private Asset Id is less then 100001");
        }
        const identity: ClientIdentity = ctx.clientIdentity;

        const exists: boolean = await this.myPrivateAssetExists(
            ctx,
            myPrivateAssetId
        );
        if (exists) {
            throw new Error(
                `The asset my private asset ${myPrivateAssetId} already exists`
            );
        }
        const checkAttr: boolean = identity.getMSPID() == "Org1MSP";
        if (!checkAttr) {
            throw new Error(
                `You have to be a member of Org2 to add an article`
            );
        }
        const privateArticleMeta: ArticleMeta = new ArticleMeta();
        const privateArticle: PrivateArticle = new PrivateArticle();
        const transientData: Map<string, Uint8Array> = ctx.stub.getTransient();
        // assure all transientData has been specified and that the size is equal to the value
        if (transientData.has("sources")) {
            throw new Error("Mismatch in the required private data.");
        }
        const sourceList: Array<string> = sources.split(",");
        let tests = await sourceList.map(async (source) => {
            const stat = await this.sourceExists(ctx, source);
            if (!stat) {
                throw new Error(`There is no source associated to ${source}`);
            }
        });
        await Promise.all(tests);
        privateArticleMeta.organization = identity.getAttributeValue(
            "institution"
        );
        privateArticleMeta.author = author;
        privateArticleMeta.title = title;
        privateArticleMeta.sources = sourceList;
        privateArticleMeta.time = Math.round(+new Date() / 1000).toString();
        privateArticle.article = transientData.get("article").toString();
        const buffer = Buffer.from(JSON.stringify(privateArticleMeta));
        await ctx.stub.putState(myPrivateAssetId, buffer);
        await ctx.stub.putPrivateData(
            "_implicit_org_Org1MSP",
            myPrivateAssetId,
            Buffer.from(JSON.stringify(privateArticle))
        );
        await ctx.stub.putPrivateData(
            "_implicit_org_Org2MSP",
            myPrivateAssetId,
            Buffer.from(JSON.stringify(privateArticle))
        );
        // add to the dependences of a source
        let inserts = await sourceList.map(async (source) => {
            await this.updateSourceUses(ctx, source, myPrivateAssetId);
        });
        await Promise.all(inserts);
    }

    @Transaction(false)
    @Returns("MyPrivateAsset")
    public async getCollectionName(ctx: Context): Promise<string> {
        const collectionName: string = await getCollectionName(ctx);
        return collectionName;
    }

    @Transaction(false)
    @Returns("MyPrivateAsset")
    public async readMyPrivateAsset(
        ctx: Context,
        myPrivateAssetId: string
    ): Promise<string> {
        const exists: boolean = await this.myPrivateAssetExists(
            ctx,
            myPrivateAssetId
        );
        if (!exists) {
            throw new Error(
                `The asset my private asset ${myPrivateAssetId} does not exist`
            );
        }
        let privateDataString: string;
        const collectionName: string = await getCollectionName(ctx);
        const privateData: Uint8Array = await ctx.stub.getPrivateData(
            collectionName,
            myPrivateAssetId
        );
        privateDataString = JSON.parse(privateData.toString());
        return privateDataString;
    }

    // @Transaction()
    // public async updateMyPrivateAsset(ctx: Context, myPrivateAssetId: string): Promise<void> {
    //     const exists: boolean = await this.myPrivateAssetExists(ctx, myPrivateAssetId);
    //     if (!exists) {
    //         throw new Error(`The asset my private asset ${myPrivateAssetId} does not exist`);
    //     }

    //     const privateAsset: MyPrivateAsset = new MyPrivateAsset();

    //     const transientData: Map<string, Uint8Array> = ctx.stub.getTransient();
    //     if (transientData.size === 0 || !transientData.has('privateValue')) {
    //         throw new Error('The privateValue key was not specified in transient data. Please try again.');
    //     }
    //     privateAsset.privateValue = transientData.get('privateValue').toString();

    //     const collectionName: string = await getCollectionName(ctx);
    //     await ctx.stub.putPrivateData(collectionName, myPrivateAssetId, Buffer.from(JSON.stringify(privateAsset)));
    // }

    // @Transaction()
    // public async deleteMyPrivateAsset(ctx: Context, myPrivateAssetId: string): Promise<void> {
    //     const exists: boolean = await this.myPrivateAssetExists(ctx, myPrivateAssetId);
    //     if (!exists) {
    //         throw new Error(`The asseđt my private asset ${myPrivateAssetId} does not exist`);
    //     }

    //     const collectionName: string = await getCollectionName(ctx);
    //     await ctx.stub.deletePrivateData(collectionName, myPrivateAssetId);
    // }
    // _implicit_org_Org1MSP
    @Transaction()
    public async verifyMyPrivateAsset(
        ctx: Context,
        mspid: string,
        myPrivateAssetId: string,
        objectToVerify: PrivateArticle
    ): Promise<boolean> {
        // Convert user provided object into a hash
        const hashToVerify: string = crypto
            .createHash("sha256")
            .update(JSON.stringify(objectToVerify))
            .digest("hex");
        const pdHashBytes: Uint8Array = await ctx.stub.getPrivateDataHash(
            `_implicit_org_${mspid}`,
            myPrivateAssetId
        );
        if (pdHashBytes.length === 0) {
            throw new Error(
                `No private data hash with the Key: ${myPrivateAssetId}`
            );
        }
        const actualHash: string = Buffer.from(pdHashBytes).toString("hex");
        // Compare the hash calculated (from object provided) and the hash stored on public ledger
        if (hashToVerify === actualHash) {
            return true;
        } else {
            return false;
        }
    }

    @Transaction()
    public async hashCompare(
        ctx: Context,
        mspid: string,
        myPrivateAssetId: string,
        objectToVerify: MyPrivateAsset
    ): Promise<Array<string>> {
        // Convert user provided object into a hash
        const hashToVerify: string = crypto
            .createHash("sha256")
            .update(JSON.stringify(objectToVerify))
            .digest("hex");
        const pdHashBytes: Uint8Array = await ctx.stub.getPrivateDataHash(
            `_implicit_org_${mspid}`,
            myPrivateAssetId
        );
        if (pdHashBytes.length === 0) {
            throw new Error(
                `No private data hash with the Key: ${myPrivateAssetId}`
            );
        }
        const actualHash: string = Buffer.from(pdHashBytes).toString("hex");
        // Compare the hash calculated (from object provided) and the hash stored on public ledger
        return [hashToVerify, actualHash];
    }
}
