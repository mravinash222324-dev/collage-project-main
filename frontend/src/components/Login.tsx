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
  Text,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  HStack,
} from "@chakra-ui/react";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import BearAvatar from "./BearAvatar";

const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);

interface UserResponse {
  role: "Teacher" | "HOD/Admin" | string;
  first_name?: string;
  last_name?: string;
}

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

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
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", tokenResponse.data.refresh);

      const userResponse = await api.get<UserResponse>(
        "/auth/users/me/"
      );

      const userRole = userResponse.data.role;
      const firstName = userResponse.data.first_name || "";
      const lastName = userResponse.data.last_name || "";

      localStorage.setItem("userRole", userRole);
      localStorage.setItem("firstName", firstName);
      localStorage.setItem("lastName", lastName);
      localStorage.setItem("fullName", `${firstName} ${lastName}`.trim());

      window.dispatchEvent(new Event("userRoleChange"));

      if (userRole === "Teacher" || userRole === "HOD/Admin") {
        navigate("/teacher-dashboard");
      } else {
        navigate("/student-dashboard");
      }
    } catch (err: any) {
      console.error("Login Error Details:", err);
      toast({
        title: "Login Failed",
        description: err.response?.data?.detail || err.message || "Connection failed. Check console.",
        status: "error",
        duration: 5000,
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
      position="relative"
      direction={{ base: "column", md: "row" }}
      justify="center"
      align="center"
      bg="gray.900"
      color="white"
      overflowX="hidden"
    >
      {/* Animated Background Elements */}
      <MotionBox
        position="absolute"
        top="-10%"
        left="-5%"
        w="96"
        h="96"
        rounded="full"
        bgGradient="radial(cyan.600, transparent)"
        filter="blur(100px)"
        opacity={0.4}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <MotionBox
        position="absolute"
        bottom="-10%"
        right="-5%"
        w="96"
        h="96"
        rounded="full"
        bgGradient="radial(purple.600, transparent)"
        filter="blur(100px)"
        opacity={0.4}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating Emojis */}
      <MotionBox
        position="absolute"
        top="20%"
        left="10%"
        fontSize="4xl"
        animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        🚀
      </MotionBox>
      <MotionBox
        position="absolute"
        bottom="20%"
        right="10%"
        fontSize="4xl"
        animate={{ y: [0, -30, 0], rotate: [0, -10, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        🎓
      </MotionBox>
      <MotionBox
        position="absolute"
        top="15%"
        right="20%"
        fontSize="3xl"
        animate={{ y: [0, -25, 0], rotate: [0, 15, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity, delay: 1 }}
      >
        💻
      </MotionBox>
      <MotionBox
        position="absolute"
        bottom="10%"
        left="20%"
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

      {/* LEFT SIDE — Title / Tagline */}
      <Flex
        flex="1"
        direction="column"
        justify="center"
        align={{ base: "center", md: "flex-start" }}
        px={{ base: 6, md: 16 }}
        textAlign={{ base: "center", md: "left" }}
        zIndex={2}
      >
        <MotionHeading
          size={{ base: "xl", md: "4xl" }}
          fontWeight="extrabold"
          mb={{ base: 3, md: 5 }}
          mt={{ base: 10, md: 0 }}
          lineHeight="1.2"
          bgGradient="linear(to-r, cyan.400, blue.500, purple.600)"
          bgClip="text"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          AI-Based College <br /> Project Management
        </MotionHeading>

        <MotionText
          maxW={{ base: "full", md: "lg" }}
          color="gray.300"
          fontSize={{ base: "md", md: "xl" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          A next-generation platform that merges collaboration, automation, and
          AI intelligence to simplify your academic project journey.
        </MotionText>
      </Flex>

      {/* RIGHT SIDE — Login Box */}
      <Flex
        flex="1"
        justify="center"
        align="center"
        px={{ base: 6, md: 12 }}
        py={{ base: 10, md: 0 }}
        mb={{ base: 10, md: 0 }}
        zIndex={2}
      >
        <MotionBox
          className="glass-card"
          w={{ base: "full", sm: "80%", md: "sm", lg: "md" }}
          p={8}
          pt={12} // Extra padding top for the bear
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          bg="rgba(255, 255, 255, 0.05)"
          border="1px solid rgba(255, 255, 255, 0.1)"
          backdropFilter="blur(10px)"
          borderRadius="xl"
          position="relative"
        >
          {/* BEAR AVATAR */}
          <Box position="absolute" top="-60px" left="0" right="0" display="flex" justifyContent="center">
            <BearAvatar isPasswordFocused={isPasswordFocused} textLength={username.length} />
          </Box>

          <Heading
            size="lg"
            textAlign="center"
            mb={8}
            mt={6}
            color="white"
          >
            Welcome Back! 👋
          </Heading>

          <VStack as="form" spacing={5} onSubmit={handleLogin}>
            <FormControl id="username" isRequired>
              <FormLabel color="gray.300" fontWeight="medium">
                Register Number
              </FormLabel>
              <Input
                type="text"
                placeholder="Enter your register number"
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                onFocus={() => setIsPasswordFocused(false)}
                variant="filled"
                bg="rgba(0, 0, 0, 0.3)"
                borderColor="rgba(255, 255, 255, 0.1)"
                color="white"
                _hover={{ bg: "rgba(0, 0, 0, 0.4)", borderColor: "cyan.400" }}
                _focus={{
                  bg: "rgba(0, 0, 0, 0.5)",
                  borderColor: "cyan.400",
                  boxShadow: "0 0 0 1px cyan",
                }}
                size="lg"
                borderRadius="lg"
              />
            </FormControl>

            <FormControl id="password" isRequired>
              <FormLabel color="gray.300" fontWeight="medium">
                Password
              </FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
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
                  _focus={{
                    bg: "rgba(0, 0, 0, 0.5)",
                    borderColor: "cyan.400",
                    boxShadow: "0 0 0 1px cyan",
                  }}
                  size="lg"
                  borderRadius="lg"
                />
                <InputRightElement h="full">
                  <IconButton
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    icon={showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    onClick={() => setShowPassword(!showPassword)}
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: "cyan.400", bg: "transparent" }}
                    _active={{ bg: "transparent" }}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <Button
              type="submit"
              isLoading={isLoading}
              w="full"
              size="lg"
              mt={4}
              bgGradient="linear(to-r, cyan.500, blue.600)"
              color="white"
              _hover={{
                bgGradient: "linear(to-r, cyan.400, blue.500)",
                transform: "translateY(-2px)",
                boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
              }}
              transition="all 0.3s ease"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <HStack justify="space-between" w="full">
              <Button
                variant="link"
                size="sm"
                color="cyan.300"
                fontWeight="medium"
                onClick={() => navigate('/register')}
                _hover={{ color: "cyan.200" }}
              >
                Create Account
              </Button>
              <Button
                variant="link"
                size="sm"
                color="cyan.300"
                fontWeight="medium"
                onClick={() => navigate('/forgot-password')}
                _hover={{ color: "cyan.200" }}
              >
                Forgot Password?
              </Button>
            </HStack>
          </VStack>
        </MotionBox>
      </Flex>
    </Flex>
  );
};

export default Login;
