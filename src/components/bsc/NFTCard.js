import React from 'react'
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardMedia from '@material-ui/core/CardMedia';

const useStyles = makeStyles((theme) => ({

    root: {
        maxWidth: 800,
    },
    media: {
        height: "35vh"
    },
}));

const NFTCard = ({ image }) => {
    const classes = useStyles();


    return (
        <Card className={classes.root} >
            <CardActionArea>
                <CardMedia
                    className={classes.media}
                    image={image}
                    title="Contemplative Reptile"
                />
            </CardActionArea>
        </Card>
    );

}
export default NFTCard;