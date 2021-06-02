import React from 'react';
import { GAS_LIMIT } from '../../config/settings.js'
import { TextField, Button } from '@material-ui/core/'
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Web3 from 'web3';
import Alert from '@material-ui/lab/Alert';

const WithdrawMaticDialog = ({ maticBalance, accounts, dexContract, maticWithdrawDialogOpen, setMaticWithdrawDialogOpen }) => {
    const defaultDialogContentText = 'Please, specify the amount (Matic) to withdraw.';
    const [dialogContentText, setDialogContentText] = React.useState(defaultDialogContentText);

    const [amount, setAmount] = React.useState('');

    const handleSubmit = async () => {
        if (parseFloat(amount) > parseFloat(maticBalance)) {
            setDialogContentText(<Alert severity="info">The withdrawal amount can not exceed the balance!</Alert>);
            return;
        }

        const weiAmount = Web3.utils.toWei(amount.toString(), 'ether');
        let config = {
            gas: GAS_LIMIT,
            from: accounts[0]
        }
        await dexContract.methods.withdrawEth(weiAmount).send(config);
        handleCloseWithDialogContentTextReset();
    };

    const handleCloseWithDialogContentTextReset = async () => {
        setDialogContentText(defaultDialogContentText);
        setMaticWithdrawDialogOpen(false);
        setAmount('');
    };

    return (
        <>
            <Dialog open={maticWithdrawDialogOpen} onClose={handleCloseWithDialogContentTextReset} aria-labelledby="form-dialog-title" disableBackdropClick>
                <DialogTitle id="form-dialog-title">Matic withdrawal</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {dialogContentText}
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="amount"
                        label="Amount"
                        value={amount}
                        onInput={e => setAmount(e.target.value)}
                        type="number"
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseWithDialogContentTextReset} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={() => { handleSubmit() }} color="primary">
                        Withdraw
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )

}

export default WithdrawMaticDialog;