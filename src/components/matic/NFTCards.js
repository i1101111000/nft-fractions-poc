import React from 'react'
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Box from '@material-ui/core/Box';
import CardActions from '@material-ui/core/CardActions';
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme) => ({

    root: {
        maxWidth: 400
    },
    card: {
        width: "200px",
        height: "222px"
    },
    media: {
        height: "25vh",
        width: "41vh",
    },
}));

const NFTCards = ({ nftList }) => {
    const classes = useStyles();

    return (
        <Grid container>
            {nftList.map((row) => (
                <Grid item xs={12} md={6} key={row.name}>
                    <Box ml={5} mb={6} >
                        <Card className={classes.root} >
                            <Link to={`/matic/nft/${row.tokenId}`} style={{ textDecoration: 'none' }}>
                                <CardActionArea>
                                    <CardMedia
                                        className={classes.media}
                                        image={row.image}
                                        title={row.name}
                                    />
                                    <CardContent>
                                        <Typography gutterBottom variant="h6" component="p" color="textPrimary" >
                                            {row.name}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Link>
                            <CardActions>
                                <Box mr={10} ml={1}>
                                    <Typography variant="body2" color="textSecondary" component="p">
                                        {row.author}
                                    </Typography>
                                </Box>                                <Box>
                                    <Typography variant="body2" color="textSecondary" component="p">
                                        Own/Total shares: {row.myShares}/{row.sharesAmount}
                                    </Typography>
                                </Box>
                            </CardActions>
                        </Card>
                    </Box>
                </Grid>
            ))}
        </Grid>
    );

}
export default NFTCards;