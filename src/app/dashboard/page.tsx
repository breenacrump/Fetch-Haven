"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";
import {
    Container,
    Box,
    Paper,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Pagination,
} from "@mui/material";
import DogCard from "@/components/DogCard";
import FavoritesList from "@/components/FavoritesList";
import LogoutIcon from "@mui/icons-material/Logout";

type Dog = {
    id: string;
    name: string;
    breed: string;
    age: number;
    image: string;
};

export default function DashboardPage() {
    const { isAuthenticated, logout } = useSession();
    const router = useRouter();
    const [breeds, setBreeds] = useState([]);
    const [selectedBreed, setSelectedBreed] = useState("");
    const [dogs, setDogs] = useState([]);
    const [favorites, setFavorites] = useState<{ id: string }[]>([]);
    const [sortOrder, setSortOrder] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showMatch, setShowMatch] = useState(false);
    const [matchedDog, setMatchedDog] = useState<{ id: string } | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/");
            return;
        }
        fetchBreeds();
    }, [isAuthenticated]);

    useEffect(() => {
        fetchDogs();
    }, [selectedBreed, sortOrder, currentPage]);

    const fetchBreeds = async () => {
        try {
            const response = await fetch(
                "https://frontend-take-home-service.fetch.com/dogs/breeds",
                {
                    credentials: "include",
                }
            );
            const data = await response.json();
            setBreeds(data);
        } catch (error) {
            console.error("Error fetching breeds:", error);
        }
    };

    const fetchDogs = async () => {
        try {
            const queryParams = new URLSearchParams({
                sort: `breed:${sortOrder}`,
                size: "20",
                from: ((currentPage - 1) * 20).toString(),
            });

            if (selectedBreed) {
                queryParams.append("breeds", selectedBreed);
            }

            const response = await fetch(
                `https://frontend-take-home-service.fetch.com/dogs/search?${queryParams}`,
                { credentials: "include" }
            );
            const searchData = await response.json();

            const dogsResponse = await fetch(
                "https://frontend-take-home-service.fetch.com/dogs",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(searchData.resultIds),
                    credentials: "include",
                }
            );

            const dogsData = await dogsResponse.json();
            setDogs(dogsData);
            setTotalPages(Math.ceil(searchData.total / 20));
        } catch (error) {
            console.error("Error fetching dogs:", error);
        }
    };

    const generateMatch = async () => {
        try {
            const response = await fetch(
                "https://frontend-take-home-service.fetch.com/dogs/match",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(favorites.map((dog) => dog.id)),
                    credentials: "include",
                }
            );

            const { match } = await response.json();
            const matchedDog =
                favorites.find((dog) => dog.id === match) || null;
            setMatchedDog(matchedDog);
            setShowMatch(true);
        } catch (error) {
            console.error("Error generating match:", error);
        }
    };

    const toggleFavorite = (dog: Dog) => {
        setFavorites((prev) => {
            const exists = prev.find((f) => f.id === dog.id);
            if (exists) {
                return prev.filter((f) => f.id !== dog.id);
            }
            return [...prev, dog];
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <Container maxWidth="xl">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Dog Adoption Search</h1>
                    <Button
                        variant="outlined"
                        startIcon={<LogoutIcon />}
                        onClick={logout}
                        className="ml-4"
                    >
                        Logout
                    </Button>
                </div>

                <Box className="flex flex-col lg:flex-row gap-6">
                    <Box className="flex-1">
                        <Paper className="p-4 mb-4">
                            <Box className="flex flex-col sm:flex-row gap-4">
                                <FormControl fullWidth>
                                    <InputLabel>Breed</InputLabel>
                                    <Select
                                        value={selectedBreed}
                                        label="Breed"
                                        onChange={(e) =>
                                            setSelectedBreed(e.target.value)
                                        }
                                    >
                                        <MenuItem value="">All Breeds</MenuItem>
                                        {breeds.map((breed) => (
                                            <MenuItem key={breed} value={breed}>
                                                {breed}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel>Sort Order</InputLabel>
                                    <Select
                                        value={sortOrder}
                                        label="Sort Order"
                                        onChange={(e) =>
                                            setSortOrder(e.target.value)
                                        }
                                    >
                                        <MenuItem value="asc">
                                            Sort A-Z
                                        </MenuItem>
                                        <MenuItem value="desc">
                                            Sort Z-A
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Paper>

                        <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dogs.map((dog) => (
                                <DogCard
                                    key={dog.id}
                                    dog={dog}
                                    isFavorite={favorites.some(
                                        (f) => f.id === dog.id
                                    )}
                                    onFavoriteToggle={() => toggleFavorite(dog)}
                                />
                            ))}
                        </Box>

                        <Box className="flex justify-center mt-8">
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={(e, page) => setCurrentPage(page)}
                                color="primary"
                            />
                        </Box>
                    </Box>

                    <Box className="w-full lg:w-80">
                        <FavoritesList
                            favorites={favorites}
                            onRemove={toggleFavorite}
                            onGenerateMatch={generateMatch}
                        />
                        {showMatch && matchedDog && (
                            <Paper className="mt-4 p-4">
                                <h2 className="text-xl font-bold mb-4">
                                    Your Match!
                                </h2>
                                <DogCard
                                    dog={matchedDog}
                                    isFavorite={true}
                                    onFavoriteToggle={() => {}}
                                    showFavorite={false}
                                />
                            </Paper>
                        )}
                    </Box>
                </Box>
            </Container>
        </div>
    );
}
