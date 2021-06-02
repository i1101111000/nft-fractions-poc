import React, { useState, useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import DepositMaticDialog from './DepositMaticDialog.js';
import WithdrawMaticDialog from './WithdrawMaticDialog.js';
import { Button } from '@material-ui/core/'
import Web3 from 'web3';

const MaticBalance = ({ accounts, dexContract }) => {
    const [maticBalance, setMaticBalance] = useState(0);
    const [maticReservedBalance, setMaticReservedBalance] = useState(0);
    const [maticDepositDialogOpen, setMaticDepositDialogOpen] = useState(false);
    const [maticWithdrawDialogOpen, setMaticWithdrawDialogOpen] = useState(false);

    useEffect(() => {
        const loadMaticBalance = async () => {
            let maticBalanceFromChain = await dexContract.methods.getEthBalance(accounts[0]).call();
            maticBalanceFromChain = Web3.utils.fromWei(maticBalanceFromChain, 'ether');
            setMaticBalance(maticBalanceFromChain);
            let maticReservedBalanceFromChain = await dexContract.methods.getEthReserveBalance(accounts[0]).call();
            maticReservedBalanceFromChain = Web3.utils.fromWei(maticReservedBalanceFromChain, 'ether');
            setMaticReservedBalance(maticReservedBalanceFromChain);
        }
        loadMaticBalance();
        // eslint-disable-next-line
    }, []);

    return (
        <>
            <Box mt={5} mb={3}>
                <Typography>
                    Your Matic Balance: {maticBalance}
                </Typography>
            </Box>
            <Box mb={5}>
                <Typography>
                    Matic reserved in orders: {maticReservedBalance}
                </Typography>
            </Box>
            <Button
                onClick={() => { debugger; setMaticDepositDialogOpen(true) }}
                variant="outlined"
                type="submit">
                Deposit
            </Button>
            <Button
                onClick={() => { setMaticWithdrawDialogOpen(true) }}
                variant="outlined"
                type="submit">
                Withdraw
            </Button>
            <DepositMaticDialog
                accounts={accounts}
                dexContract={dexContract}
                maticDepositDialogOpen={maticDepositDialogOpen}
                setMaticDepositDialogOpen={setMaticDepositDialogOpen} />
            <WithdrawMaticDialog
                maticBalance={maticBalance}
                accounts={accounts}
                dexContract={dexContract}
                maticWithdrawDialogOpen={maticWithdrawDialogOpen}
                setMaticWithdrawDialogOpen={setMaticWithdrawDialogOpen} />
        </>
    )

}

export default MaticBalance;