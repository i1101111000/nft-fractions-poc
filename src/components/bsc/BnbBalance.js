import React, { useState, useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import DepositBnbDialog from './DepositBnbDialog.js';
import WithdrawBnbDialog from './WithdrawBnbDialog.js';
import { Button } from '@material-ui/core/'
import Web3 from 'web3';

const BnbBalance = ({ accounts, dexContract }) => {
    const [bnbBalance, setBnbBalance] = useState(0);
    const [bnbReservedBalance, setBnbReservedBalance] = useState(0);
    const [bnbDepositDialogOpen, setBnbDepositDialogOpen] = useState(false);
    const [bnbWithdrawDialogOpen, setBnbWithdrawDialogOpen] = useState(false);

    useEffect(() => {
        const loadBnbBalance = async () => {
            let bnbBalanceFromChain = await dexContract.methods.getEthBalance(accounts[0]).call();
            bnbBalanceFromChain = Web3.utils.fromWei(bnbBalanceFromChain, 'ether');
            setBnbBalance(bnbBalanceFromChain);
            let bnbReservedBalanceFromChain = await dexContract.methods.getEthReserveBalance(accounts[0]).call();
            bnbReservedBalanceFromChain = Web3.utils.fromWei(bnbReservedBalanceFromChain, 'ether');
            setBnbReservedBalance(bnbReservedBalanceFromChain);
        }
        loadBnbBalance();
        // eslint-disable-next-line
    }, []);

    return (
        <>
            <Box mt={5} mb={3}>
                <Typography>
                    Your BNB Balance: {bnbBalance}
                </Typography>
            </Box>
            <Box mb={5}>
                <Typography>
                    BNB reserved in orders: {bnbReservedBalance}
                </Typography>
            </Box>
            <Button
                onClick={() => { setBnbDepositDialogOpen(true) }}
                variant="outlined"
                type="submit">
                Deposit
            </Button>
            <Button
                onClick={() => { setBnbWithdrawDialogOpen(true) }}
                variant="outlined"
                type="submit">
                Withdraw
            </Button>
            <DepositBnbDialog
                accounts={accounts}
                dexContract={dexContract}
                bnbDepositDialogOpen={bnbDepositDialogOpen}
                setBnbDepositDialogOpen={setBnbDepositDialogOpen} />
            <WithdrawBnbDialog
                bnbBalance={bnbBalance}
                accounts={accounts}
                dexContract={dexContract}
                bnbWithdrawDialogOpen={bnbWithdrawDialogOpen}
                setBnbWithdrawDialogOpen={setBnbWithdrawDialogOpen} />
        </>
    )

}

export default BnbBalance;