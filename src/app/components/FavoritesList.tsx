import { Paper, List, ListItem, Box, IconButton, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useSession } from "@/context/SessionContext";

type FavoritesListProps = {
    favorites: { id: string; name: string; breed: string }[];
    onRemove: (dog: { id: string; name: string; breed: string }) => void;
    onGenerateMatch: () => void;
};

export default function FavoritesList({
    favorites,
    onRemove,
    onGenerateMatch,
}: FavoritesListProps) {
    const { user } = useSession();

    return (
        <Paper className="p-4">
            <h2 className="text-xl font-bold mb-4">
                {user?.name ? `${user.name}'s Favorites` : "Favorites"} (
                {favorites.length})
            </h2>
            <List className="space-y-2">
                {favorites.map((dog) => (
                    <ListItem key={dog.id} className="bg-gray-50 rounded">
                        <div>
                            <p className="font-medium">{dog.name}</p>
                            <p className="text-sm text-gray-600">{dog.breed}</p>
                        </div>
                        <Box>
                            <IconButton
                                edge="end"
                                onClick={() => onRemove(dog)}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </ListItem>
                ))}
            </List>
            {favorites.length > 0 && (
                <Button
                    variant="contained"
                    fullWidth
                    onClick={onGenerateMatch}
                    className="mt-4"
                >
                    Generate Match
                </Button>
            )}
        </Paper>
    );
}
