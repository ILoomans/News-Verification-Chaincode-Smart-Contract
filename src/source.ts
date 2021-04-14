/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from "fabric-contract-api";

@Object()
export class Source {
    @Property()
    public name: string;
    public verificationStatus: boolean;
    public initialVerifier: string;
    public introducer: string;
    public time: string;
    public uses: Array<string>;
    public objections: Array<object>;
    public support: Array<object>;
    public location: string;
    public data: string;
}
