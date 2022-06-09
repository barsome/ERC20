import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, constants, Signer, BigNumber } from "ethers";





const TOKEN_NAME: string = "My Token";
const TOKEN_SYMBOL: string = "MTK";
const TOKEN_DECIMAL: number = 18;
const TOKEN_TOTALSUPPLY: number = 10000;
const TOTALSUPPLY_FORMAT: BigNumber = BigNumber.from(TOKEN_TOTALSUPPLY).mul(BigNumber.from(10).pow(BigNumber.from(TOKEN_DECIMAL)));
const ZERO_ADDRESS: string = constants.AddressZero;
const SIMPLE_AMOUNT: BigNumber = BigNumber.from(100);
const MAX_UINT256: BigNumber = BigNumber.from(2).pow(BigNumber.from(256)).sub(1);
async function deployContract(): Promise<Contract> {
    const MyToken = await ethers.getContractFactory("MyToken");
    let contract = await MyToken.deploy(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMAL, TOKEN_TOTALSUPPLY);
    await contract.deployed();
    return contract;
}

async function connectContract(contract: Contract, account: Signer): Promise<Contract> {

    return contract.connect(account);
}
describe("ERC20 Contract", () => {
    let accounts: Signer[];
    let ownerAddress: string;
    let contract: Contract;
    beforeEach(async () => {
        accounts = await ethers.getSigners();
        contract = await deployContract();
    })
    it("has a name", async () => {
        expect(await contract.name()).to.eq(TOKEN_NAME);
    });

    it("has a symbol", async () => {
        expect(await contract.symbol()).to.eq(TOKEN_SYMBOL);
    });

    it("has a decimal", async () => {
        expect(await contract.decimal()).to.eq(TOKEN_DECIMAL);
    })

    it("total supply", async () => {
        expect(await contract.totalSupply()).to.eq(TOTALSUPPLY_FORMAT);
    })

    describe("#transfer", async () => {
        it("send token to zero address", async () => {
            contract = await connectContract(contract, accounts[0]);
            await expect(contract.transfer(ZERO_ADDRESS, SIMPLE_AMOUNT))
                .to.be.revertedWith("transfer to zero address!");
        });
        it("sender don't enough token", async () => {
            contract = await connectContract(contract, accounts[1]);
            await expect(contract.transfer(await accounts[2].getAddress(), SIMPLE_AMOUNT))
                .to.be.revertedWith("not enough token to transfer!");

        });
        it("send token from account[0] to another account", async () => {
            contract = await connectContract(contract, accounts[0]);
            await contract.transfer(await accounts[1].getAddress(), SIMPLE_AMOUNT);
            const balanceAccount0: BigNumber = await contract.balanceOf(await accounts[0].getAddress());
            const balanceAccount1: BigNumber = await contract.balanceOf(await accounts[1].getAddress()); +
                expect(balanceAccount1).to.be.equal(SIMPLE_AMOUNT);
            expect(balanceAccount0).to.be.equal(TOTALSUPPLY_FORMAT.sub(SIMPLE_AMOUNT));
        })
        it("emit event Transfer", async () => {
            contract = await connectContract(contract, accounts[0]);

            expect(await contract.transfer(await accounts[1].getAddress(), SIMPLE_AMOUNT))
                .to.emit(contract, "Transfer")
                .withArgs(await accounts[0].getAddress(), await accounts[1].getAddress(), SIMPLE_AMOUNT);
        })

    })


    describe("#approve", async () => {
        it("approve to zero address", async () => {
            contract = await connectContract(contract, accounts[0]);
            await expect(contract.approve(ZERO_ADDRESS, SIMPLE_AMOUNT))
                .to.revertedWith("approve to zero address")
        });

        it("approve account1 to account2", async () => {
            contract = await connectContract(contract, accounts[1]);
            await contract.approve(accounts[2].getAddress(), SIMPLE_AMOUNT);
            const allowanceAmount2: BigNumber = await contract.allowance(accounts[1].getAddress(), accounts[2].getAddress());
            expect(allowanceAmount2).to.be.equal(SIMPLE_AMOUNT);

        });

        it("Approve event", async () => {
            contract = await connectContract(contract, accounts[0]);
            await expect(await contract.approve(accounts[1].getAddress(), SIMPLE_AMOUNT))
                .to.emit(contract, "Approval")
                .withArgs(await accounts[0].getAddress(), await accounts[1].getAddress(), SIMPLE_AMOUNT);
        });
    });

    describe("#transferFrom", () => {
        describe("when the token owner is not zero address", async () => {
            describe("when the recipient is not zero address", async () => {
                describe("when the spender has enough allowance", async () => {
                    beforeEach(async () => {
                        contract = await connectContract(contract, accounts[0]);
                        await contract.approve(await accounts[1].getAddress(), SIMPLE_AMOUNT);
                    });
                    it("trasfers the requested amount", async () => {
                        contract = await connectContract(contract, accounts[1]);
                        await contract.transferFrom(await accounts[0].getAddress(), await accounts[2].getAddress(), SIMPLE_AMOUNT);
                        const balanceAccount0: BigNumber = await contract.balanceOf(await accounts[0].getAddress());
                        const balanceAccount1: BigNumber = await contract.balanceOf(await accounts[2].getAddress());
                        expect(balanceAccount0).to.eq(TOTALSUPPLY_FORMAT.sub(SIMPLE_AMOUNT));
                        expect(balanceAccount1).to.eq(SIMPLE_AMOUNT);
                        const allowanceAmount1: BigNumber = await contract.allowance(await accounts[0].getAddress(), await accounts[1].getAddress());
                        expect(allowanceAmount1).to.eq(0);
                    });
                    it("emit a transfer event", async () => {
                        contract = await connectContract(contract, accounts[1]);
                        expect(await contract.transferFrom(await accounts[0].getAddress(), await accounts[2].getAddress(), SIMPLE_AMOUNT))
                            .to.emit(contract, "Transfer").withArgs(await accounts[0].getAddress(), await accounts[2].getAddress(), SIMPLE_AMOUNT);
                    });
                    it("emit a approve event", async () => {
                        contract = await connectContract(contract, accounts[1]);
                        const allowanceAmount: BigNumber = await contract.allowance(await accounts[0].getAddress(), await accounts[1].getAddress());
                        expect(await contract.transferFrom(await accounts[0].getAddress(), await accounts[2].getAddress(), SIMPLE_AMOUNT))
                            .to.emit(contract, "Transfer").withArgs(await accounts[0].getAddress(), await accounts[2].getAddress(), allowanceAmount);
                    });
                    describe("when the token owner does not have enough balance", async () => {
                        beforeEach("reducing balance", async () => {
                            contract = await connectContract(contract, accounts[0]);
                            await contract.transfer(await accounts[3].getAddress(), TOTALSUPPLY_FORMAT.sub(SIMPLE_AMOUNT.sub(1)));
                        });
                        it("reverts", async () => {
                            contract = await connectContract(contract, accounts[1]);
                            await expect(contract.transferFrom(await accounts[0].getAddress(), await accounts[2].getAddress(), SIMPLE_AMOUNT)).to.be.revertedWith("not enough token to transfer!");
                        });
                    });
                    describe("when the sender does not have enough allowance", async () => {
                        it("reverts", async () => {
                            contract = await connectContract(contract, accounts[1]);
                            await expect(contract.transferFrom(await accounts[0].getAddress(), await accounts[2].getAddress(), SIMPLE_AMOUNT.add(1)))
                                .to.be.revertedWith("not enough allowance!");
                        });
                    });
                });
                describe("when the spender has unlimited allowance", async () => {
                    beforeEach("unlimit allowanc", async () => {
                        contract = await connectContract(contract, accounts[0]);
                        await contract.approve(await accounts[1].getAddress(), MAX_UINT256);
                    })
                    it("send token from spender", async () => {
                        contract = await connectContract(contract, accounts[1]);
                        await contract.transferFrom(await accounts[0].getAddress(), await accounts[2].getAddress(), TOTALSUPPLY_FORMAT);
                        const balanceAccount0: number = await contract.balanceOf(await accounts[0].getAddress());
                        const balanceAccount2: number = await contract.balanceOf(await accounts[2].getAddress());
                        const allowanceAccount1: number = await contract.allowance(await accounts[0].getAddress(), await accounts[1].getAddress());
                        expect(balanceAccount0).to.eq(0);
                        expect(balanceAccount2).to.eq(TOTALSUPPLY_FORMAT);
                        expect(allowanceAccount1).to.eq(MAX_UINT256);
                    });
                    it("does not emit an approval event", async () => {
                        contract = await connectContract(contract, accounts[1]);
                        await expect(contract.transferFrom(await accounts[0].getAddress(), await accounts[2].getAddress(), TOTALSUPPLY_FORMAT)).to.not.emit(contract, "Approval");
                    })
                });
                describe("when the spender does not have enough allowane", async () => {
                    beforeEach(async () => {
                        contract = await connectContract(contract, accounts[0]);
                        await contract.approve(await accounts[1].getAddress(), SIMPLE_AMOUNT);
                    });
                    it("revert", async () => {
                        contract = await connectContract(contract, accounts[1]);
                        await expect(contract.transferFrom(await accounts[0].getAddress(), await accounts[2].getAddress(), SIMPLE_AMOUNT.add(1)))
                            .to.be.revertedWith("not enough allowance!");
                    });
                });
            });
            describe("when the recipient is the zero address", async () => {
                beforeEach(async () => {
                    contract = await connectContract(contract, accounts[0]);
                    await contract.approve(await accounts[1].getAddress(), SIMPLE_AMOUNT);
                });
                it("reverts", async () => {
                    contract = await connectContract(contract, accounts[1]);
                    await expect(contract.transferFrom(await accounts[0].getAddress(), ZERO_ADDRESS, SIMPLE_AMOUNT))
                        .to.be.revertedWith("transfer to zero address!");
                });
            })
            describe("when the owner  is zero address", async () => {
                it("reverts", async () => {
                    contract = await connectContract(contract, accounts[0]);
                    await expect(contract.transferFrom(ZERO_ADDRESS, await accounts[1].getAddress(), SIMPLE_AMOUNT))
                        .to.be.revertedWith("transfer from zero address!");
                });

            });
        });
    });
});