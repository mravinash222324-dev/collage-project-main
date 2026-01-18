// frontend/src/components/ForgotPassword.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Flex,
  HStack,
  PinInput,
  PinInputField,
} from '@chakra-ui/react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Lucide from "lucide-react";
import BearAvatar from './BearAvatar';

const { ArrowLeft, Mail, Lock, KeyRound } = Lucide;

const MotionBox = motion(Box);
const MotionHeading = motion(Heading);

const ForgotPassword: React.FC = () => {
  // UI State: 1=Email, 2=OTP, 3=NewPassword
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Data State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  // STEP 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/auth/password-reset/request/', { email });

      toast({
        title: 'OTP Sent!',
        description: `We sent a code to ${email}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
      setStep(2); // Move to OTP step
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Could not send OTP. Try again.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Validate OTP Input (Client side only for now)
  const handleVerifyOTPLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({ title: 'Invalid OTP', description: 'OTP must be 6 digits.', status: 'warning' });
      return;
    }
    setStep(3); // Move to Password step
  };

  // STEP 3: Final Reset (Sends Email + OTP + NewPassword)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

    if (newPassword !== confirmPassword) {
      toast({ title: 'Mismatch', description: 'Passwords do not match.', status: 'warning' });
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/auth/password-reset/confirm/', {
        email,
        otp,
        new_password: newPassword,
      });

      toast({
        title: 'Password Reset Successful',
        description: 'You can now login with your new password.',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
      navigate('/'); // Redirect to Login
    } catch (error: any) {
      toast({
        title: 'Reset Failed',
        description: error.response?.data?.error || 'Invalid OTP or Request.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate text length for bear eyes
  const getTextLength = () => {
    if (step === 1) return email.length;
    if (step === 2) return otp.length;
    return 0; // Don't track password length for eyes
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
      color="white"
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
        left="10%"
        fontSize="4xl"
        animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        🔐
      </MotionBox>
      <MotionBox
        position="absolute"
        bottom="20%"
        right="15%"
        fontSize="4xl"
        animate={{ y: [0, -30, 0], rotate: [0, -10, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        🔑
      </MotionBox>
      <MotionBox
        position="absolute"
        top="10%"
        right="20%"
        fontSize="3xl"
        animate={{ y: [0, -25, 0], rotate: [0, 15, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity, delay: 1 }}
      >
        🛡️
      </MotionBox>
      <MotionBox
        position="absolute"
        bottom="10%"
        left="20%"
        fontSize="3xl"
        animate={{ y: [0, -15, 0], rotate: [0, -5, 5, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, delay: 0.5 }}
      >
        ❓
      </MotionBox>

      {/* Main Card */}
      <MotionBox
        className="glass-card"
        w={{ base: "90%", sm: "450px" }}
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
          <BearAvatar isPasswordFocused={isPasswordFocused} textLength={getTextLength()} />
        </Box>

        <VStack spacing={6} align="stretch" mt={6}>
          {/* Header */}
          <Box textAlign="center">
            <MotionHeading
              size="lg"
              mb={2}
              bgGradient="linear(to-r, cyan.400, blue.500)"
              bgClip="text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {step === 1 ? 'Forgot Password?' : step === 2 ? 'Enter OTP' : 'Reset Password'}
            </MotionHeading>
            <Text color="gray.400" fontSize="sm">
              {step === 1 && "Don't worry! Enter your email to get a reset code."}
              {step === 2 && `We sent a 6-digit code to ${email}`}
              {step === 3 && "Create a new strong password."}
            </Text>
          </Box>

          {/* STEP 1: EMAIL FORM */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP}>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel color="gray.300">Email Address</FormLabel>
                  <HStack
                    bg="rgba(0,0,0,0.3)"
                    borderRadius="lg"
                    px={3}
                    py={1}
                    border="1px solid"
                    borderColor="rgba(255,255,255,0.1)"
                    _focusWithin={{ borderColor: 'cyan.400', boxShadow: '0 0 0 1px cyan' }}
                  >
                    <Mail size={20} color="#A0AEC0" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setIsPasswordFocused(false)}
                      placeholder="student@example.com"
                      variant="unstyled"
                      p={2}
                      autoFocus
                      color="white"
                    />
                  </HStack>
                </FormControl>
                <Button
                  w="full"
                  type="submit"
                  isLoading={isLoading}
                  bgGradient="linear(to-r, cyan.500, blue.600)"
                  color="white"
                  _hover={{
                    bgGradient: "linear(to-r, cyan.400, blue.500)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
                  }}
                  borderRadius="xl"
                  size="lg"
                >
                  Send OTP
                </Button>
              </VStack>
            </form>
          )}

          {/* STEP 2: OTP FORM */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTPLocal}>
              <VStack spacing={6}>
                <FormControl display="flex" justifyContent="center">
                  <HStack spacing={2}>
                    <PinInput
                      otp
                      value={otp}
                      onChange={(val) => { setOtp(val); setIsPasswordFocused(false); }}
                      size="lg"
                      placeholder="·"
                      focusBorderColor="cyan.400"
                    >
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <PinInputField
                          key={i}
                          bg="rgba(0,0,0,0.3)"
                          borderColor="rgba(255,255,255,0.1)"
                          color="white"
                          _focus={{ borderColor: 'cyan.400', transform: 'scale(1.1)' }}
                        />
                      ))}
                    </PinInput>
                  </HStack>
                </FormControl>
                <Button
                  w="full"
                  type="submit"
                  bgGradient="linear(to-r, cyan.500, blue.600)"
                  color="white"
                  _hover={{
                    bgGradient: "linear(to-r, cyan.400, blue.500)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
                  }}
                  borderRadius="xl"
                  size="lg"
                >
                  Verify & Continue
                </Button>
                <Button variant="link" size="sm" color="cyan.300" onClick={() => setStep(1)}>
                  Change Email
                </Button>
              </VStack>
            </form>
          )}

          {/* STEP 3: PASSWORD FORM */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel color="gray.300">New Password</FormLabel>
                  <HStack
                    bg="rgba(0,0,0,0.3)"
                    borderRadius="lg"
                    px={3}
                    py={1}
                    border="1px solid"
                    borderColor="rgba(255,255,255,0.1)"
                    _focusWithin={{ borderColor: 'cyan.400', boxShadow: '0 0 0 1px cyan' }}
                  >
                    <KeyRound size={20} color="#A0AEC0" />
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      placeholder="Enter new password"
                      variant="unstyled"
                      p={2}
                      autoComplete="new-password"
                      color="white"
                    />
                  </HStack>
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.300">Confirm Password</FormLabel>
                  <HStack
                    bg="rgba(0,0,0,0.3)"
                    borderRadius="lg"
                    px={3}
                    py={1}
                    border="1px solid"
                    borderColor="rgba(255,255,255,0.1)"
                    _focusWithin={{ borderColor: 'cyan.400', boxShadow: '0 0 0 1px cyan' }}
                  >
                    <Lock size={20} color="#A0AEC0" />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      placeholder="Confirm new password"
                      variant="unstyled"
                      p={2}
                      autoComplete="new-password"
                      color="white"
                    />
                  </HStack>
                </FormControl>
                <Button
                  w="full"
                  type="submit"
                  isLoading={isLoading}
                  bgGradient="linear(to-r, green.400, teal.500)"
                  color="white"
                  _hover={{
                    bgGradient: "linear(to-r, green.500, teal.600)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 0 20px rgba(72, 187, 120, 0.3)",
                  }}
                  borderRadius="xl"
                  size="lg"
                >
                  Set New Password
                </Button>
              </VStack>
            </form>
          )}

          <Button
            variant="ghost"
            color="gray.400"
            size="sm"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate('/')}
            mt={2}
            _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
          >
            Back to Login
          </Button>

        </VStack>
      </MotionBox>
    </Flex>
  );
};

export default ForgotPassword;