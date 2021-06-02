import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { GAS_LIMIT } from '../../config/settings.js'
import Alert from '@material-ui/lab/Alert';

function TokenTransferApprovalDialog({ open, nftFractionsRepositoryContract, accounts, setTokenTransferDialogOpen, dexContractAddress }) {
    const defaultDialogContentText = 'You have to approve the token transfer, so once your order matches a buy order the tokens will be automatically transferred!';
    const [dialogContentText, setDialogContentText] = React.useState(defaultDialogContentText);

    const handleApproval = async () => {
        let config = {
            gas: GAS_LIMIT,
            from: accounts[0]
        }
        await nftFractionsRepositoryContract.methods.setApprovalForAll(dexContractAddress, true).send(config)
            .on('error', error => {
                setDialogContentText(<Alert severity="error">Transaction has reverted: Please, note that only the seller can approve the token trasnfer!</Alert>)
            });
        handleCloseWithDialogContentTextReset();
    }

    const handleCloseWithDialogContentTextReset = () => {
        setDialogContentText(defaultDialogContentText);
        setTokenTransferDialogOpen(false);
    }

    return (
        <div>
            <Dialog open={open} onClose={handleCloseWithDialogContentTextReset} aria-labelledby="form-dialog-title" disableBackdropClick>
                <DialogTitle id="form-dialog-title">Token transfer approval</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {dialogContentText}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { handleApproval() }} color="primary">
                        Approve
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default TokenTransferApprovalDialog;
