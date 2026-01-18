import React, { useState } from "react";
import api from "../config/api";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  VStack,
  Alert,
  AlertIcon,
  Flex,
  Text,
  useToast,
  HStack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import BearAvatar from "./BearAvatar";

const MotionBox = motion(Box);
const MotionHeading = motion(Heading);

const Register: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState(""); // This will be the Register Number
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/users/", {
        first_name: firstName,
        last_name: lastName,
        username, // Register Number
        email,
        password,
        role: "Student",
      });

      toast({
        title: "Registration Successful!",
        description: "Your account has been created. Please log in.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });

      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data
        ? Object.entries(err.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(" | ")
        : "Registration failed. Please check your details.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      w="100%"
      minH="100vh"
      overflowX="hidden"
      position="relative"
      align="center"
      justify="center"
      bg="gray.900"
      color="gray.800"
    >
      {/* Animated Background Glows */}
      <motion.div
        style={{
          position: "absolute",
          top: "-15%",
          left: "-10%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(66, 153, 225, 0.2), transparent)",
          filter: "blur(80px)",
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "-10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(129, 140, 248, 0.2), transparent)",
          filter: "blur(80px)",
        }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating Emojis */}
      <MotionBox
        position="absolute"
        top="15%"
        right="15%"
        fontSize="5xl"
        animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        ✨
      </MotionBox>
      <MotionBox
        position="absolute"
        bottom="15%"
        left="15%"
        fontSize="5xl"
        animate={{ y: [0, -30, 0], rotate: [0, -10, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        🚀
      </MotionBox>
      <MotionBox
        position="absolute"
        top="10%"
        left="20%"
        fontSize="3xl"
        animate={{ y: [0, -25, 0], rotate: [0, 15, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity, delay: 1 }}
      >
        💻
      </MotionBox>
      <MotionBox
        position="absolute"
        bottom="10%"
        right="20%"
        fontSize="3xl"
        animate={{ y: [0, -15, 0], rotate: [0, -5, 5, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, delay: 0.5 }}
      >
        💡
      </MotionBox>
      <MotionBox
        position="absolute"
        top="40%"
        left="5%"
        fontSize="2xl"
        animate={{ x: [0, 20, 0], rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity }}
      >
        ⚛️
      </MotionBox>
      <MotionBox
        position="absolute"
        top="10%"
        right="5%"
        fontSize="2xl"
        animate={{ y: [0, 15, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 5.5, repeat: Infinity }}
      >
        📚
      </MotionBox>

      {/* Registration Card */}
      <MotionBox
        className="glass-card"
        w={{ base: "90%", sm: "500px" }}
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8 }}
        zIndex={2}
        p={8}
        pt={12} // Extra padding for bear
        bg="rgba(255, 255, 255, 0.05)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        backdropFilter="blur(10px)"
        borderRadius="xl"
        position="relative"
      >
        {/* BEAR AVATAR */}
        <Box position="absolute" top="-60px" left="0" right="0" display="flex" justifyContent="center">
          <BearAvatar isPasswordFocused={isPasswordFocused} textLength={username.length + firstName.length} />
        </Box>

        <MotionHeading
          size="lg"
          textAlign="center"
          mb={6}
          mt={6}
          color="white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Join the Future! 🚀
        </MotionHeading>

        {error && (
          <Alert status="error" borderRadius="md" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}

        <form onSubmit={handleRegister}>
          <VStack spacing={4} align="stretch">
            <HStack spacing={4}>
              <FormControl id="firstName" isRequired>
                <FormLabel color="gray.300" fontWeight="bold">First Name</FormLabel>
                <Input
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onFocus={() => setIsPasswordFocused(false)}
                  variant="filled"
                  bg="rgba(0, 0, 0, 0.3)"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  color="white"
                  _hover={{ bg: "rgba(0, 0, 0, 0.4)", borderColor: "cyan.400" }}
                  _focus={{ borderColor: "cyan.400", boxShadow: "0 0 0 1px cyan" }}
                  borderRadius="lg"
                />
              </FormControl>
              <FormControl id="lastName" isRequired>
                <FormLabel color="gray.300" fontWeight="bold">Last Name</FormLabel>
                <Input
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onFocus={() => setIsPasswordFocused(false)}
                  variant="filled"
                  bg="rgba(0, 0, 0, 0.3)"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  color="white"
                  _hover={{ bg: "rgba(0, 0, 0, 0.4)", borderColor: "cyan.400" }}
                  _focus={{ borderColor: "cyan.400", boxShadow: "0 0 0 1px cyan" }}
                  borderRadius="lg"
                />
              </FormControl>
            </HStack>

            <FormControl id="username" isRequired>
              <FormLabel color="gray.300" fontWeight="bold">
                Register Number
              </FormLabel>
              <Input
                type="text"
                placeholder="e.g., icaxscs019"
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                onFocus={() => setIsPasswordFocused(false)}
                variant="filled"
                bg="rgba(0, 0, 0, 0.3)"
                borderColor="rgba(255, 255, 255, 0.1)"
                color="white"
                _hover={{ bg: "rgba(0, 0, 0, 0.4)", borderColor: "cyan.400" }}
                _focus={{ borderColor: "cyan.400", boxShadow: "0 0 0 1px cyan" }}
                borderRadius="lg"
              />
            </FormControl>

            <FormControl id="email" isRequired>
              <FormLabel color="gray.300" fontWeight="bold">
                Email Address
              </FormLabel>
              <Input
                type="email"
                placeholder="user@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsPasswordFocused(false)}
                variant="filled"
                bg="rgba(0, 0, 0, 0.3)"
                borderColor="rgba(255, 255, 255, 0.1)"
                color="white"
                _hover={{ bg: "rgba(0, 0, 0, 0.4)", borderColor: "cyan.400" }}
                _focus={{ borderColor: "cyan.400", boxShadow: "0 0 0 1px cyan" }}
                borderRadius="lg"
              />
            </FormControl>

            <FormControl id="password" isRequired>
              <FormLabel color="gray.300" fontWeight="bold">
                Password
              </FormLabel>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                variant="filled"
                bg="rgba(0, 0, 0, 0.3)"
                borderColor="rgba(255, 255, 255, 0.1)"
                color="white"
                _hover={{ bg: "rgba(0, 0, 0, 0.4)", borderColor: "cyan.400" }}
                _focus={{ borderColor: "cyan.400", boxShadow: "0 0 0 1px cyan" }}
                borderRadius="lg"
              />
            </FormControl>

            <Button
              type="submit"
              size="lg"
              mt={4}
              isLoading={loading}
              loadingText="Creating..."
              bgGradient="linear(to-r, cyan.500, blue.600)"
              color="white"
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
                bgGradient: "linear(to-r, cyan.400, blue.500)",
              }}
              borderRadius="xl"
              transition="all 0.3s ease"
              shadow="md"
            >
              Register
            </Button>
          </VStack>
        </form>

        <Text
          fontSize="sm"
          textAlign="center"
          color="gray.400"
          pt={4}
          mt={2}
        >
          Already have an account?{" "}
          <RouterLink
            to="/"
            style={{
              color: "#63B3ED",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            Sign In
          </RouterLink>
        </Text>
      </MotionBox>
    </Flex>
  );
};

export default Register;
