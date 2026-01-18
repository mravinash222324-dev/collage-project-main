import React, { useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Box,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    useToast,
    HStack,
    Text,
    Icon,
} from '@chakra-ui/react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import Editor from '@monaco-editor/react';
import { Copy, Terminal } from 'lucide-react';
import api from '../config/api';

interface RefactorPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    originalCode: string;
    refactoredCode: string;
    fileName: string;
    projectId: number | null;
}

const RefactorPreview: React.FC<RefactorPreviewProps> = ({
    isOpen,
    onClose,
    originalCode,
    refactoredCode,
    fileName,
    projectId,
}) => {
    const [tabIndex, setTabIndex] = useState(0);
    const toast = useToast();

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(refactoredCode);
            toast({
                title: 'Code Copied!',
                description: 'Refactored code copied to clipboard.',
                status: 'success',
                duration: 2000,
            });

            // Log Activity
            if (projectId) {
                try {
                    await api.post('/log-activity/', {
                        action: 'Code Copied (Refactor)',
                        project_id: projectId,
                        details: { file: fileName }
                    });
                } catch (error) {
                    console.error("Failed to log activity", error);
                }
            }
        } catch (err) {
            toast({
                title: 'Failed to copy',
                description: 'Could not copy code to clipboard.',
                status: 'error',
            });
        }
    };

    const extension = fileName.split('.').pop() || 'javascript';
    const languageMap: { [key: string]: string } = {
        'py': 'python',
        'js': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'jsx': 'javascript',
        'html': 'html',
        'css': 'css',
        'java': 'java',
        'cpp': 'cpp',
    };
    const language = languageMap[extension] || 'javascript';

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="full" scrollBehavior="inside">
            <ModalOverlay backdropFilter="blur(5px)" />
            <ModalContent bg="gray.900" color="white">
                <ModalHeader>
                    <HStack>
                        <Icon as={Terminal} color="cyan.400" />
                        <Text>AI Refactor Preview: {fileName}</Text>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody p={0}>
                    <Tabs index={tabIndex} onChange={setTabIndex} variant="soft-rounded" colorScheme="cyan" height="100%" display="flex" flexDirection="column">
                        <Box px={4} pt={2} bg="gray.800" borderBottom="1px solid" borderColor="whiteAlpha.100">
                            <TabList mb={2}>
                                <Tab color="gray.400" _selected={{ color: 'white', bg: 'whiteAlpha.200' }}>Diff View</Tab>
                                <Tab color="gray.400" _selected={{ color: 'white', bg: 'whiteAlpha.200' }}>Sandbox (Edit & Run)</Tab>
                            </TabList>
                        </Box>

                        <TabPanels flex="1" overflow="hidden">
                            <TabPanel p={0} height="100%" overflowY="auto">
                                <Box bg="gray.900" p={4}>
                                    <ReactDiffViewer
                                        oldValue={originalCode}
                                        newValue={refactoredCode}
                                        splitView={true}
                                        compareMethod={DiffMethod.WORDS}
                                        styles={{
                                            variables: {
                                                dark: {
                                                    diffViewerBackground: '#171923',
                                                    diffViewerTitleBackground: '#2D3748',
                                                    addedBackground: '#044B53', // Cyan-ish dark
                                                    addedColor: '#81E6D9',
                                                    removedBackground: '#63171B', // Red-ish dark
                                                    removedColor: '#FEB2B2',
                                                    wordAddedBackground: '#2C7A7B',
                                                    wordRemovedBackground: '#9B2C2C',
                                                }
                                            }
                                        }}
                                        useDarkTheme={true}
                                        leftTitle="Original"
                                        rightTitle="Refactored (AI)"
                                    />
                                </Box>
                            </TabPanel>
                            <TabPanel p={0} height="100%">
                                <Editor
                                    height="100%"
                                    theme="vs-dark"
                                    language={language}
                                    value={refactoredCode}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        readOnly: false, // Allow editing in sandbox
                                    }}
                                />
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </ModalBody>

                <ModalFooter bg="gray.800" borderTop="1px solid" borderColor="whiteAlpha.100">
                    <Button variant="ghost" mr={3} onClick={onClose} color="gray.400" _hover={{ bg: 'whiteAlpha.100', color: 'white' }}>
                        Close
                    </Button>
                    <Button
                        leftIcon={<Copy size={16} />}
                        colorScheme="cyan"
                        onClick={handleCopyCode}
                        bgGradient="linear(to-r, cyan.500, blue.500)"
                        _hover={{ bgGradient: "linear(to-r, cyan.400, blue.400)" }}
                    >
                        Copy Refactored Code
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default RefactorPreview;
