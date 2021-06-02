import React from 'react';
import { GAS_LIMIT } from '../../config/settings.js'
import { TextField, Button } from '@material-ui/core/'
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Typography from '@material-ui/core/Typography'
import Box from '@material-ui/core/Box';

const PlaceBuyOrder = ({
    web3,
    maticBalance,
    maticReservedBalance,
    tokenId,
    accounts,
    dexContract,
    placeBuyOrderDialogOpen,
    setPlaceBuyOrderDialogOpen,
    sellOrderAvailable
}) => {
    const [amount, setAmount] = React.useState('');
    const [price, setPrice] = React.useState('');
    const [marketPerLimit, setMarketPerLimit] = React.useState('limit');
    const defaultDialogContentText = 'Please, specify the order type, the amount and the price in case of limit orders! ';
    const [dialogContentText, setDialogContentText] = React.useState(defaultDialogContentText);

    const handleSubmit = async () => {
        if (marketPerLimit === 'limit' && (price === '' || price < 0)) {
            setDialogContentText('Please, set a positive price!');
            return;
        }
        if (amount === '' || amount < 0) {
            setDialogContentText('Please, set a positive amount!');
            return;
        }
        if (marketPerLimit === 'limit' && amount * price > maticBalance - maticReservedBalance) {
            setDialogContentText('Your available Matic balance is too low!');
            return;
        }
        if (maticBalance - maticReservedBalance === 0) {
            setDialogContentText('Your available Matic balance is too low!');
            return;
        }
        if (marketPerLimit === 'market' && sellOrderAvailable === false) {
            setDialogContentText('There is no sell order to match against');
            return;
        }
        let config = {
            gas: GAS_LIMIT,
            from: accounts[0]
        }
        if (marketPerLimit === 'market') {
            await dexContract.methods.createMarketOrder(tokenId, amount, 0).send(config);
        } else {
            const weiPrice = web3.utils.toWei(price.toString(), 'ether');
            await dexContract.methods.createLimitOrder(tokenId, amount, weiPrice, 0).send(config);
        }

        handleClose();
    };

    const handleClose = async () => {
        setAmount('');
        setPrice('');
        setDialogContentText(defaultDialogContentText);
        setPlaceBuyOrderDialogOpen(false);
    };

    const handleRadioChange = ev => {
        setMarketPerLimit(ev.target.value);
    };

    const displayPriceField = () => {
        if (marketPerLimit === 'limit') {
            return <TextField
                autoFocus
                margin="dense"
                id="price"
                label="Price"
                value={price}
                onInput={e => setPrice(e.target.value)}
                type="number"
                fullWidth
            />
        }
    }

    return (
        <Dialog open={placeBuyOrderDialogOpen} onClose={handleClose} aria-labelledby="form-dialog-title" disableBackdropClick>
            <DialogTitle id="form-dialog-title">Place buy order</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {dialogContentText}
                    <Box mt={1}>
                        <Typography variant="body1" color="textSecondary" component="p">
                            Your available Matic balance: {maticBalance - maticReservedBalance}
                        </Typography>
                    </Box>
                </DialogContentText>
                <RadioGroup row aria-label="position" name="position" onChange={handleRadioChange} value={marketPerLimit} >
                    <FormControlLabel
                        value="limit"
                        control={<Radio color="primary" />}
                        label="Limit"
                        labelPlacement="start"
                    />
                    <FormControlLabel
                        value="market"
                        control={<Radio color="primary" />}
                        label="Market"
                        labelPlacement="start"
                    />
                </RadioGroup>
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
                {displayPriceField()}

            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Cancel
                    </Button>
                <Button onClick={() => { handleSubmit() }} color="primary">
                    Place
                    </Button>
            </DialogActions>
        </Dialog>
    )

}

export default PlaceBuyOrder;