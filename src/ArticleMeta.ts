/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from "fabric-contract-api";

@Object()
export class ArticleMeta {
    @Property()
    public organization: string;
    public author: string;
    public title: string;
    public sources: Array<string>;
    public time: string;
}
