import React from 'react';
import { GAS_LIMIT } from '../../config/settings.js'
import { TextField, Button } from '@material-ui/core/'
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import ERC721 from '../../contracts/bsc/ERC721.json';

const DepositNft = ({ web3, accounts, nftFractionsRepositoryContract, nftDepositDialogOpen, setNftDepositDialogOpen }) => {
    const defaultDialogContentText = 'Please, specify the contract address and the token id of your NFT along with the amount of shares that you want to create! Before the deposit the system will ask your allowance to transfer the NFT.';
    const [dialogContentText, setDialogContentText] = React.useState(defaultDialogContentText);

    const [originalContract, setOriginalContract] = React.useState('');
    const [originalTokenId, setOriginalTokenId] = React.useState('');
    const [fractionsAmount, setFractionsAmount] = React.useState('');

    const handleSubmit = async () => {
        let config = {
            gas: GAS_LIMIT,
            from: accounts[0]
        }
        const erc721contract = new web3.eth.Contract(ERC721.abi, originalContract);
        await erc721contract.methods.approve(nftFractionsRepositoryContract._address, originalTokenId).send(config);
        await nftFractionsRepositoryContract.methods.depositNft(originalContract, originalTokenId, fractionsAmount).send(config);

        handleCloseWithDialogContentTextReset();
    };

    const handleCloseWithDialogContentTextReset = async () => {
        setOriginalContract('');
        setOriginalTokenId('');
        setFractionsAmount('');
        setDialogContentText(defaultDialogContentText);
        setNftDepositDialogOpen(false);
    };

    return (
        <>
            <Dialog open={nftDepositDialogOpen} onClose={handleCloseWithDialogContentTextReset} aria-labelledby="form-dialog-title" disableBackdropClick>
                <DialogTitle id="form-dialog-title">NFT deposit</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {dialogContentText}
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="originalContract"
                        label="Contract address"
                        value={originalContract}
                        onInput={e => setOriginalContract(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        id="originalTokenId"
                        label="Token ID"
                        value={originalTokenId}
                        onInput={e => setOriginalTokenId(e.target.value)}
                        type="number"
                        fullWidth
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        id="fractionsAmount"
                        label="Shares amount"
                        value={fractionsAmount}
                        onInput={e => setFractionsAmount(e.target.value)}
                        type="number"
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseWithDialogContentTextReset} color="primary">
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

export default DepositNft;