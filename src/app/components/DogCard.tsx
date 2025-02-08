import { Card, CardMedia, CardContent, IconButton } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

export type Dog = {
    id: string;
    name: string;
    breed: string;
    age: number;
    img: string;
    zip_code: string;
};

type DogCardProps = {
    dog: Dog;
    isFavorite: boolean;
    onFavoriteToggle?: () => void;
    showFavorite?: boolean;
};

export default function DogCard({
    dog,
    isFavorite,
    onFavoriteToggle = () => {},
    showFavorite = true,
}: DogCardProps) {
    return (
        <Card className="relative">
            <div>
                <CardMedia
                    component="img"
                    height="200"
                    image={dog.img}
                    alt={dog.name}
                    className="h-48 w-full object-cover"
                />
            </div>
            <CardContent>
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">{dog.name}</h3>
                    {showFavorite && (
                        <IconButton
                            onClick={onFavoriteToggle}
                            className="bg-white hover:bg-gray-100"
                        >
                            {isFavorite ? (
                                <FavoriteIcon color="secondary" />
                            ) : (
                                <FavoriteBorderIcon />
                            )}
                        </IconButton>
                    )}
                </div>
                <p className="text-gray-600">Breed: {dog.breed}</p>
                <p className="text-gray-600">Age: {dog.age} years</p>
                <p className="text-gray-600">Location: {dog.zip_code}</p>
            </CardContent>
        </Card>
    );
}
