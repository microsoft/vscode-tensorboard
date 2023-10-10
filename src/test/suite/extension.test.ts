// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai';

describe('Authentication', function () {
    before(async function () {
        //
    });
    // beforeEach(() => (disposableStore = new DisposableStore()));
    // afterEach(() => disposableStore.dispose());
    // after(async () => {
    //     // Delete all tokens generated.
    //     await Promise.all(
    //         generatedTokens.map((item) =>
    //             deleteApiToken(baseUrl, username, item.tokenId, item.token, fetch, cancellationToken.token).catch(noop)
    //         )
    //     );
    //     cancellationToken.dispose();
    // });

    it('should get Auth info', async () => {
        expect('Hello').to.be.a('string').that.is.not.equal('');
    });
});
