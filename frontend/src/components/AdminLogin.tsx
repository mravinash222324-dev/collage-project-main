import React, { useState } from "react";
import {
    Box,
    Button,
    Flex,
    Heading,
    Input,
    VStack,
    FormControl,
    FormLabel,
    useToast,
    InputGroup,
    InputRightElement,
    IconButton,
    Icon,
    Container,
} from "@chakra-ui/react";
import { Eye, EyeOff, ShieldCheck, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../config/api";

const MotionBox = motion(Box);
const MotionHeading = motion(Heading);

interface UserResponse {
    role: "Teacher" | "HOD/Admin" | string;
    first_name?: string;
    last_name?: string;
}

const AdminLogin: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const toast = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const tokenResponse = await api.post(
                "/auth/jwt/create/",
                { username, password }
            );

            const accessToken = tokenResponse.data.access;
            // We don't set it globally just yet, we need to verify role first
            // But we need it to fetch 'me'. 
            // Let's use a temporary header or just set it and clear if fail.
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", tokenResponse.data.refresh);

            const userResponse = await api.get<UserResponse>(
                "/auth/users/me/"
            );

            const userRole = userResponse.data.role;

            if (userRole !== "HOD/Admin") {
                throw new Error("Access Denied: Admins Only");
            }

            const firstName = userResponse.data.first_name || "";
            const lastName = userResponse.data.last_name || "";

            localStorage.setItem("userRole", userRole);
            localStorage.setItem("firstName", firstName);
            localStorage.setItem("lastName", lastName);
            localStorage.setItem("fullName", `${firstName} ${lastName}`.trim());

            window.dispatchEvent(new Event("userRoleChange"));

            toast({
                title: "Admin Access Granted",
                status: "success",
                duration: 2000,
                position: "top",
            });

            navigate("/admin/dashboard");

        } catch (err: any) {
            console.error(err);
            // Clean up if we set anything
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");

            let message = "Invalid credentials.";
            if (err.message === "Access Denied: Admins Only") {
                message = "This portal is restricted to Administrators.";
            }

            toast({
                title: "Login Failed",
                description: message,
                status: "error",
                duration: 4000,
                isClosable: true,
                position: "top",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Flex
            w="100%"
            minH="100vh"
            justify="center"
            align="center"
            bg="gray.900"
            bgGradient="linear(to-br, gray.900, #1e1b4b)"
            color="white"
            overflow="hidden"
            position="relative"
        >
            {/* Background Accents */}
            <Box position="absolute" top="-20%" left="-10%" w="600px" h="600px" bg="purple.900" filter="blur(150px)" opacity="0.4" borderRadius="full" />
            <Box position="absolute" bottom="-20%" right="-10%" w="500px" h="500px" bg="cyan.900" filter="blur(150px)" opacity="0.3" borderRadius="full" />

            <Container maxW="md" zIndex={1}>
                <MotionBox
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    bg="rgba(15, 23, 42, 0.6)"
                    backdropFilter="blur(20px)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    borderRadius="2xl"
                    p={8}
                    boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                >
                    <VStack spacing={6}>
                        <Box p={4} bg="whiteAlpha.100" borderRadius="full" color="cyan.400">
                            <Icon as={ShieldCheck} w={10} h={10} />
                        </Box>

                        <VStack spacing={1}>
                            <MotionHeading
                                size="xl"
                                textAlign="center"
                                bgGradient="linear(to-r, cyan.400, purple.400)"
                                bgClip="text"
                            >
                                Admin Portal
                            </MotionHeading>
                            <Box h="1px" w="100px" bgGradient="linear(to-r, transparent, cyan.500, transparent)" />
                        </VStack>

                        <VStack as="form" spacing={5} w="full" onSubmit={handleLogin}>
                            <FormControl id="username" isRequired>
                                <FormLabel color="gray.400" fontSize="sm">Username / Admin ID</FormLabel>
                                <Input
                                    type="text"
                                    placeholder="Enter admin ID"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    variant="filled"
                                    bg="rgba(0, 0, 0, 0.3)"
                                    borderColor="rgba(255, 255, 255, 0.05)"
                                    color="white"
                                    h="50px"
                                    _hover={{ borderColor: "cyan.500", bg: "rgba(0,0,0,0.4)" }}
                                    _focus={{
                                        borderColor: "cyan.500",
                                        boxShadow: "0 0 0 1px #06b6d4"
                                    }}
                                />
                            </FormControl>

                            <FormControl id="password" isRequired>
                                <FormLabel color="gray.400" fontSize="sm">Password</FormLabel>
                                <InputGroup>
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        variant="filled"
                                        bg="rgba(0, 0, 0, 0.3)"
                                        borderColor="rgba(255, 255, 255, 0.05)"
                                        color="white"
                                        h="50px"
                                        _hover={{ borderColor: "purple.500", bg: "rgba(0,0,0,0.4)" }}
                                        _focus={{
                                            borderColor: "purple.500",
                                            boxShadow: "0 0 0 1px #a855f7"
                                        }}
                                    />
                                    <InputRightElement h="full" mr={1}>
                                        <IconButton
                                            aria-label="Toggle password"
                                            icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            onClick={() => setShowPassword(!showPassword)}
                                            variant="ghost"
                                            color="gray.400"
                                            _hover={{ color: "white" }}
                                            size="sm"
                                        />
                                    </InputRightElement>
                                </InputGroup>
                            </FormControl>

                            <Button
                                type="submit"
                                isLoading={isLoading}
                                w="full"
                                h="50px"
                                mt={2}
                                bgGradient="linear(to-r, cyan.600, purple.600)"
                                color="white"
                                fontSize="lg"
                                fontWeight="bold"
                                _hover={{
                                    bgGradient: "linear(to-r, cyan.500, purple.500)",
                                    transform: "translateY(-1px)",
                                    boxShadow: "0 10px 20px -10px rgba(168, 85, 247, 0.5)"
                                }}
                                _active={{ transform: "translateY(0)" }}
                                leftIcon={<Icon as={Lock} size={18} />}
                            >
                                Access Dashboard
                            </Button>
                        </VStack>
                    </VStack>
                </MotionBox>

                <Box textAlign="center" mt={6} color="gray.500" fontSize="xs">
                    <p>Restricted access area. Unauthorized access is prohibited.</p>
                </Box>
            </Container>
        </Flex>
    );
};

export default AdminLogin;
