import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import Grid from '@material-ui/core/Grid';
import { TextField } from '@material-ui/core/';
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from '@material-ui/core/Tooltip';
import { GAS_LIMIT } from '../../config/settings.js'

const useStyles = makeStyles({
    table: {
        minWidth: 450,
    },
    root: {
        '& > *': {
            borderBottom: 'unset',
        },
    },
});

const deleteIconDisplay = (row, accounts, dexContract) => {
    let deleteIcon;
    if (row.trader === accounts[0]) {
        deleteIcon = <Tooltip title="Delete">
            <IconButton aria-label="delete" onClick={() => { handleOrderDelete(row.tokenId, row.id, accounts, dexContract) }}>
                <DeleteIcon />
            </IconButton>
        </Tooltip>;
    }
    return deleteIcon;
}

const handleOrderDelete = async (tokenId, orderId, accounts, dexContract) => {
    let config = {
        gas: GAS_LIMIT,
        from: accounts[0]
    };
    await dexContract.methods.deleteOrder(tokenId, 0, orderId).send(config);
}

const Row = ({ row, accounts, dexContract }) => {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);

    return (
        <>
            <TableRow key={row.id} className={classes.root}>
                <TableCell>
                    <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell>{row.ethPrice}</TableCell>
                <TableCell>{row.amount}</TableCell>
                <TableCell>{row.filled}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Grid container className={classes.root}>
                            <Grid md={2}></Grid>
                            <Grid item xs={12} md={8}>
                                <TextField InputProps={{ disableUnderline: true }} label="Trader" value={row.trader} fullwidth margin="dense" />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                {deleteIconDisplay(row, accounts, dexContract)}
                            </Grid>
                        </Grid>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    )
}

function BuyOrders({ orders, accounts, dexContract }) {
    const classes = useStyles();

    const rowsDisplay = () => {
        if (orders.length === 0) {
            return <Box mt={1} mb={1} ml={2}>
                <Typography variant='subtitle2'>No orders</Typography>
            </Box>
        } else {
            return <TableBody>
                {orders.map((row) => (
                    <Row row={row} accounts={accounts} dexContract={dexContract} />
                ))}
            </TableBody>
        }
    }

    return (
        <TableContainer className={classes.table} component={Paper}>
            <Table aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell />
                        <TableCell>Price (ETH)</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Filled</TableCell>
                    </TableRow>
                </TableHead>
                {rowsDisplay()}
            </Table>
        </TableContainer>
    );
}

export default BuyOrders;
