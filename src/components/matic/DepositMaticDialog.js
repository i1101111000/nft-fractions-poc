import React from 'react';
import { GAS_LIMIT } from '../../config/settings.js'
import { TextField, Button } from '@material-ui/core/'
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Web3 from 'web3';

const DepositMaticDialog = ({ accounts, dexContract, maticDepositDialogOpen, setMaticDepositDialogOpen }) => {
    const defaultDialogContentText = 'Please, specify the amount (Matic) to deposit.';
    const [dialogContentText] = React.useState(defaultDialogContentText);

    const [amount, setAmount] = React.useState('');

    const handleSubmit = async () => {
        const weiAmount = Web3.utils.toWei(amount.toString(), 'ether');
        let config = {
            gas: GAS_LIMIT,
            from: accounts[0],
            value: weiAmount
        }
        await dexContract.methods.depositEth().send(config);
        handleClose();
    };

    const handleClose = () => {
        setMaticDepositDialogOpen(false);
        setAmount('');
    };

    return (
        <>
            <Dialog open={maticDepositDialogOpen} onClose={handleClose} aria-labelledby="form-dialog-title" disableBackdropClick>
                <DialogTitle id="form-dialog-title">Matic deposit</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {dialogContentText}
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="amount"
                        label="Amount (Matic)"
                        value={amount}
                        onInput={e => setAmount(e.target.value)}
                        type="number"
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={() => { handleSubmit() }} color="primary">
                        Deposit
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )

}

export default DepositMaticDialog;