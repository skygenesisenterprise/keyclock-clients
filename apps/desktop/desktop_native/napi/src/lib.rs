#[macro_use]
extern crate napi_derive;

mod passkey_authenticator_internal;
mod registry;

#[napi]
pub mod passwords {
    /// The error message returned when a password is not found during retrieval or deletion.
    #[napi]
    pub const PASSWORD_NOT_FOUND: &str = desktop_core::password::PASSWORD_NOT_FOUND;

    /// Fetch the stored password from the keychain.
    /// Throws {@link Error} with message {@link PASSWORD_NOT_FOUND} if the password does not exist.
    #[napi]
    pub async fn get_password(service: String, account: String) -> napi::Result<String> {
        desktop_core::password::get_password(&service, &account)
            .await
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    /// Save the password to the keychain. Adds an entry if none exists otherwise updates the existing entry.
    #[napi]
    pub async fn set_password(
        service: String,
        account: String,
        password: String,
    ) -> napi::Result<()> {
        desktop_core::password::set_password(&service, &account, &password)
            .await
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    /// Delete the stored password from the keychain.
    /// Throws {@link Error} with message {@link PASSWORD_NOT_FOUND} if the password does not exist.
    #[napi]
    pub async fn delete_password(service: String, account: String) -> napi::Result<()> {
        desktop_core::password::delete_password(&service, &account)
            .await
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    /// Checks if the os secure storage is available
    #[napi]
    pub async fn is_available() -> napi::Result<bool> {
        desktop_core::password::is_available()
            .await
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }
}

#[napi]
pub mod biometrics {
    use desktop_core::biometric::{Biometric, BiometricTrait};

    // Prompt for biometric confirmation
    #[napi]
    pub async fn prompt(
        hwnd: napi::bindgen_prelude::Buffer,
        message: String,
    ) -> napi::Result<bool> {
        Biometric::prompt(hwnd.into(), message)
            .await
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn available() -> napi::Result<bool> {
        Biometric::available()
            .await
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn set_biometric_secret(
        service: String,
        account: String,
        secret: String,
        key_material: Option<KeyMaterial>,
        iv_b64: String,
    ) -> napi::Result<String> {
        Biometric::set_biometric_secret(
            &service,
            &account,
            &secret,
            key_material.map(|m| m.into()),
            &iv_b64,
        )
        .await
        .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    /// Retrieves the biometric secret for the given service and account.
    /// Throws Error with message [`passwords::PASSWORD_NOT_FOUND`] if the secret does not exist.
    #[napi]
    pub async fn get_biometric_secret(
        service: String,
        account: String,
        key_material: Option<KeyMaterial>,
    ) -> napi::Result<String> {
        Biometric::get_biometric_secret(&service, &account, key_material.map(|m| m.into()))
            .await
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    /// Derives key material from biometric data. Returns a string encoded with a
    /// base64 encoded key and the base64 encoded challenge used to create it
    /// separated by a `|` character.
    ///
    /// If the iv is provided, it will be used as the challenge. Otherwise a random challenge will be generated.
    ///
    /// `format!("<key_base64>|<iv_base64>")`
    #[napi]
    pub async fn derive_key_material(iv: Option<String>) -> napi::Result<OsDerivedKey> {
        Biometric::derive_key_material(iv.as_deref())
            .map(|k| k.into())
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi(object)]
    pub struct KeyMaterial {
        pub os_key_part_b64: String,
        pub client_key_part_b64: Option<String>,
    }

    impl From<KeyMaterial> for desktop_core::biometric::KeyMaterial {
        fn from(km: KeyMaterial) -> Self {
            desktop_core::biometric::KeyMaterial {
                os_key_part_b64: km.os_key_part_b64,
                client_key_part_b64: km.client_key_part_b64,
            }
        }
    }

    #[napi(object)]
    pub struct OsDerivedKey {
        pub key_b64: String,
        pub iv_b64: String,
    }

    impl From<desktop_core::biometric::OsDerivedKey> for OsDerivedKey {
        fn from(km: desktop_core::biometric::OsDerivedKey) -> Self {
            OsDerivedKey {
                key_b64: km.key_b64,
                iv_b64: km.iv_b64,
            }
        }
    }
}

#[napi]
pub mod clipboards {
    #[napi]
    pub async fn read() -> napi::Result<String> {
        desktop_core::clipboard::read().map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn write(text: String, password: bool) -> napi::Result<()> {
        desktop_core::clipboard::write(&text, password)
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }
}

#[napi]
pub mod sshagent {
    use std::sync::Arc;

    use desktop_core::ssh_agent::BitwardenSshKey;
    use napi::{
        bindgen_prelude::Promise,
        threadsafe_function::{ErrorStrategy::CalleeHandled, ThreadsafeFunction},
    };
    use tokio::{self, sync::Mutex};

    #[napi]
    pub struct SshAgentState {
        state: desktop_core::ssh_agent::BitwardenDesktopAgent<BitwardenSshKey>,
    }

    #[napi(object)]
    pub struct PrivateKey {
        pub private_key: String,
        pub name: String,
        pub cipher_id: String,
    }

    #[napi(object)]
    pub struct SshKey {
        pub private_key: String,
        pub public_key: String,
        pub key_fingerprint: String,
    }

    #[napi(object)]
    pub struct SshUIRequest {
        pub cipher_id: Option<String>,
        pub is_list: bool,
        pub process_name: String,
        pub is_forwarding: bool,
        pub namespace: Option<String>,
    }

    #[napi]
    pub async fn serve(
        callback: ThreadsafeFunction<SshUIRequest, CalleeHandled>,
    ) -> napi::Result<SshAgentState> {
        let (auth_request_tx, mut auth_request_rx) =
            tokio::sync::mpsc::channel::<desktop_core::ssh_agent::SshAgentUIRequest>(32);
        let (auth_response_tx, auth_response_rx) =
            tokio::sync::broadcast::channel::<(u32, bool)>(32);
        let auth_response_tx_arc = Arc::new(Mutex::new(auth_response_tx));
        tokio::spawn(async move {
            let _ = auth_response_rx;

            while let Some(request) = auth_request_rx.recv().await {
                let cloned_response_tx_arc = auth_response_tx_arc.clone();
                let cloned_callback = callback.clone();
                tokio::spawn(async move {
                    let auth_response_tx_arc = cloned_response_tx_arc;
                    let callback = cloned_callback;
                    let promise_result: Result<Promise<bool>, napi::Error> = callback
                        .call_async(Ok(SshUIRequest {
                            cipher_id: request.cipher_id,
                            is_list: request.is_list,
                            process_name: request.process_name,
                            is_forwarding: request.is_forwarding,
                            namespace: request.namespace,
                        }))
                        .await;
                    match promise_result {
                        Ok(promise_result) => match promise_result.await {
                            Ok(result) => {
                                let _ = auth_response_tx_arc
                                    .lock()
                                    .await
                                    .send((request.request_id, result))
                                    .expect("should be able to send auth response to agent");
                            }
                            Err(e) => {
                                println!("[SSH Agent Native Module] calling UI callback promise was rejected: {e}");
                                let _ = auth_response_tx_arc
                                    .lock()
                                    .await
                                    .send((request.request_id, false))
                                    .expect("should be able to send auth response to agent");
                            }
                        },
                        Err(e) => {
                            println!("[SSH Agent Native Module] calling UI callback could not create promise: {e}");
                            let _ = auth_response_tx_arc
                                .lock()
                                .await
                                .send((request.request_id, false))
                                .expect("should be able to send auth response to agent");
                        }
                    }
                });
            }
        });

        match desktop_core::ssh_agent::BitwardenDesktopAgent::start_server(
            auth_request_tx,
            Arc::new(Mutex::new(auth_response_rx)),
        )
        .await
        {
            Ok(state) => Ok(SshAgentState { state }),
            Err(e) => Err(napi::Error::from_reason(e.to_string())),
        }
    }

    #[napi]
    pub fn stop(agent_state: &mut SshAgentState) -> napi::Result<()> {
        let bitwarden_agent_state = &mut agent_state.state;
        bitwarden_agent_state.stop();
        Ok(())
    }

    #[napi]
    pub fn is_running(agent_state: &mut SshAgentState) -> bool {
        let bitwarden_agent_state = agent_state.state.clone();
        bitwarden_agent_state.is_running()
    }

    #[napi]
    pub fn set_keys(
        agent_state: &mut SshAgentState,
        new_keys: Vec<PrivateKey>,
    ) -> napi::Result<()> {
        let bitwarden_agent_state = &mut agent_state.state;
        bitwarden_agent_state
            .set_keys(
                new_keys
                    .iter()
                    .map(|k| (k.private_key.clone(), k.name.clone(), k.cipher_id.clone()))
                    .collect(),
            )
            .map_err(|e| napi::Error::from_reason(e.to_string()))?;
        Ok(())
    }

    #[napi]
    pub fn lock(agent_state: &mut SshAgentState) -> napi::Result<()> {
        let bitwarden_agent_state = &mut agent_state.state;
        bitwarden_agent_state
            .lock()
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi]
    pub fn clear_keys(agent_state: &mut SshAgentState) -> napi::Result<()> {
        let bitwarden_agent_state = &mut agent_state.state;
        bitwarden_agent_state
            .clear_keys()
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }
}

#[napi]
pub mod processisolations {
    #[napi]
    pub async fn disable_coredumps() -> napi::Result<()> {
        desktop_core::process_isolation::disable_coredumps()
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }
    #[napi]
    pub async fn is_core_dumping_disabled() -> napi::Result<bool> {
        desktop_core::process_isolation::is_core_dumping_disabled()
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }
    #[napi]
    pub async fn disable_memory_access() -> napi::Result<()> {
        desktop_core::process_isolation::disable_memory_access()
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }
}

#[napi]
pub mod powermonitors {
    use napi::{
        threadsafe_function::{
            ErrorStrategy::CalleeHandled, ThreadsafeFunction, ThreadsafeFunctionCallMode,
        },
        tokio,
    };

    #[napi]
    pub async fn on_lock(callback: ThreadsafeFunction<(), CalleeHandled>) -> napi::Result<()> {
        let (tx, mut rx) = tokio::sync::mpsc::channel::<()>(32);
        desktop_core::powermonitor::on_lock(tx)
            .await
            .map_err(|e| napi::Error::from_reason(e.to_string()))?;
        tokio::spawn(async move {
            while let Some(()) = rx.recv().await {
                callback.call(Ok(()), ThreadsafeFunctionCallMode::NonBlocking);
            }
        });
        Ok(())
    }

    #[napi]
    pub async fn is_lock_monitor_available() -> napi::Result<bool> {
        Ok(desktop_core::powermonitor::is_lock_monitor_available().await)
    }
}

#[napi]
pub mod windows_registry {
    #[napi]
    pub async fn create_key(key: String, subkey: String, value: String) -> napi::Result<()> {
        crate::registry::create_key(&key, &subkey, &value)
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn delete_key(key: String, subkey: String) -> napi::Result<()> {
        crate::registry::delete_key(&key, &subkey)
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }
}

#[napi]
pub mod ipc {
    use desktop_core::ipc::server::{Message, MessageType};
    use napi::threadsafe_function::{
        ErrorStrategy, ThreadsafeFunction, ThreadsafeFunctionCallMode,
    };

    #[napi(object)]
    pub struct IpcMessage {
        pub client_id: u32,
        pub kind: IpcMessageType,
        pub message: Option<String>,
    }

    impl From<Message> for IpcMessage {
        fn from(message: Message) -> Self {
            IpcMessage {
                client_id: message.client_id,
                kind: message.kind.into(),
                message: message.message,
            }
        }
    }

    #[napi]
    pub enum IpcMessageType {
        Connected,
        Disconnected,
        Message,
    }

    impl From<MessageType> for IpcMessageType {
        fn from(message_type: MessageType) -> Self {
            match message_type {
                MessageType::Connected => IpcMessageType::Connected,
                MessageType::Disconnected => IpcMessageType::Disconnected,
                MessageType::Message => IpcMessageType::Message,
            }
        }
    }

    #[napi]
    pub struct IpcServer {
        server: desktop_core::ipc::server::Server,
    }

    #[napi]
    impl IpcServer {
        /// Create and start the IPC server without blocking.
        ///
        /// @param name The endpoint name to listen on. This name uniquely identifies the IPC connection and must be the same for both the server and client.
        /// @param callback This function will be called whenever a message is received from a client.
        #[napi(factory)]
        pub async fn listen(
            name: String,
            #[napi(ts_arg_type = "(error: null | Error, message: IpcMessage) => void")]
            callback: ThreadsafeFunction<IpcMessage, ErrorStrategy::CalleeHandled>,
        ) -> napi::Result<Self> {
            let (send, mut recv) = tokio::sync::mpsc::channel::<Message>(32);
            tokio::spawn(async move {
                while let Some(message) = recv.recv().await {
                    callback.call(Ok(message.into()), ThreadsafeFunctionCallMode::NonBlocking);
                }
            });

            let path = desktop_core::ipc::path(&name);

            let server = desktop_core::ipc::server::Server::start(&path, send).map_err(|e| {
                napi::Error::from_reason(format!(
                    "Error listening to server - Path: {path:?} - Error: {e} - {e:?}"
                ))
            })?;

            Ok(IpcServer { server })
        }

        /// Return the path to the IPC server.
        #[napi]
        pub fn get_path(&self) -> String {
            self.server.path.to_string_lossy().to_string()
        }

        /// Stop the IPC server.
        #[napi]
        pub fn stop(&self) -> napi::Result<()> {
            self.server.stop();
            Ok(())
        }

        /// Send a message over the IPC server to all the connected clients
        ///
        /// @return The number of clients that the message was sent to. Note that the number of messages
        /// actually received may be less, as some clients could disconnect before receiving the message.
        #[napi]
        pub fn send(&self, message: String) -> napi::Result<u32> {
            self.server
                .send(message)
                .map_err(|e| {
                    napi::Error::from_reason(format!("Error sending message - Error: {e} - {e:?}"))
                })
                // NAPI doesn't support u64 or usize, so we need to convert to u32
                .map(|u| u32::try_from(u).unwrap_or_default())
        }
    }
}

#[napi]
pub mod autostart {
    #[napi]
    pub async fn set_autostart(autostart: bool, params: Vec<String>) -> napi::Result<()> {
        desktop_core::autostart::set_autostart(autostart, params)
            .await
            .map_err(|e| napi::Error::from_reason(format!("Error setting autostart - {e} - {e:?}")))
    }
}

#[napi]
pub mod autofill {
    use desktop_core::ipc::server::{Message, MessageType};
    use napi::threadsafe_function::{
        ErrorStrategy, ThreadsafeFunction, ThreadsafeFunctionCallMode,
    };
    use serde::{de::DeserializeOwned, Deserialize, Serialize};

    #[napi]
    pub async fn run_command(value: String) -> napi::Result<String> {
        desktop_core::autofill::run_command(value)
            .await
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[derive(Debug, serde::Serialize, serde:: Deserialize)]
    pub enum BitwardenError {
        Internal(String),
    }

    #[napi(string_enum)]
    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub enum UserVerification {
        #[napi(value = "preferred")]
        Preferred,
        #[napi(value = "required")]
        Required,
        #[napi(value = "discouraged")]
        Discouraged,
    }

    #[derive(Serialize, Deserialize)]
    #[serde(bound = "T: Serialize + DeserializeOwned")]
    pub struct PasskeyMessage<T: Serialize + DeserializeOwned> {
        pub sequence_number: u32,
        pub value: Result<T, BitwardenError>,
    }

    #[napi(object)]
    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct Position {
        pub x: i32,
        pub y: i32,
    }

    #[napi(object)]
    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct PasskeyRegistrationRequest {
        pub rp_id: String,
        pub user_name: String,
        pub user_handle: Vec<u8>,
        pub client_data_hash: Vec<u8>,
        pub user_verification: UserVerification,
        pub supported_algorithms: Vec<i32>,
        pub window_xy: Position,
    }

    #[napi(object)]
    #[derive(Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct PasskeyRegistrationResponse {
        pub rp_id: String,
        pub client_data_hash: Vec<u8>,
        pub credential_id: Vec<u8>,
        pub attestation_object: Vec<u8>,
    }

    #[napi(object)]
    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct PasskeyAssertionRequest {
        pub rp_id: String,
        pub client_data_hash: Vec<u8>,
        pub user_verification: UserVerification,
        pub allowed_credentials: Vec<Vec<u8>>,
        pub window_xy: Position,
        //extension_input: Vec<u8>, TODO: Implement support for extensions
    }

    #[napi(object)]
    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct PasskeyAssertionWithoutUserInterfaceRequest {
        pub rp_id: String,
        pub credential_id: Vec<u8>,
        pub user_name: String,
        pub user_handle: Vec<u8>,
        pub record_identifier: Option<String>,
        pub client_data_hash: Vec<u8>,
        pub user_verification: UserVerification,
        pub window_xy: Position,
    }

    #[napi(object)]
    #[derive(Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct PasskeyAssertionResponse {
        pub rp_id: String,
        pub user_handle: Vec<u8>,
        pub signature: Vec<u8>,
        pub client_data_hash: Vec<u8>,
        pub authenticator_data: Vec<u8>,
        pub credential_id: Vec<u8>,
    }

    #[napi]
    pub struct IpcServer {
        server: desktop_core::ipc::server::Server,
    }

    #[napi]
    impl IpcServer {
        /// Create and start the IPC server without blocking.
        ///
        /// @param name The endpoint name to listen on. This name uniquely identifies the IPC connection and must be the same for both the server and client.
        /// @param callback This function will be called whenever a message is received from a client.
        #[napi(factory)]
        pub async fn listen(
            name: String,
            // Ideally we'd have a single callback that has an enum containing the request values,
            // but NAPI doesn't support that just yet
            #[napi(
                ts_arg_type = "(error: null | Error, clientId: number, sequenceNumber: number, message: PasskeyRegistrationRequest) => void"
            )]
            registration_callback: ThreadsafeFunction<
                (u32, u32, PasskeyRegistrationRequest),
                ErrorStrategy::CalleeHandled,
            >,
            #[napi(
                ts_arg_type = "(error: null | Error, clientId: number, sequenceNumber: number, message: PasskeyAssertionRequest) => void"
            )]
            assertion_callback: ThreadsafeFunction<
                (u32, u32, PasskeyAssertionRequest),
                ErrorStrategy::CalleeHandled,
            >,
            #[napi(
                ts_arg_type = "(error: null | Error, clientId: number, sequenceNumber: number, message: PasskeyAssertionWithoutUserInterfaceRequest) => void"
            )]
            assertion_without_user_interface_callback: ThreadsafeFunction<
                (u32, u32, PasskeyAssertionWithoutUserInterfaceRequest),
                ErrorStrategy::CalleeHandled,
            >,
        ) -> napi::Result<Self> {
            let (send, mut recv) = tokio::sync::mpsc::channel::<Message>(32);
            tokio::spawn(async move {
                while let Some(Message {
                    client_id,
                    kind,
                    message,
                }) = recv.recv().await
                {
                    match kind {
                        // TODO: We're ignoring the connection and disconnection messages for now
                        MessageType::Connected | MessageType::Disconnected => continue,
                        MessageType::Message => {
                            let Some(message) = message else {
                                println!("[ERROR] Message is empty");
                                continue;
                            };

                            match serde_json::from_str::<PasskeyMessage<PasskeyAssertionRequest>>(
                                &message,
                            ) {
                                Ok(msg) => {
                                    let value = msg
                                        .value
                                        .map(|value| (client_id, msg.sequence_number, value))
                                        .map_err(|e| napi::Error::from_reason(format!("{e:?}")));

                                    assertion_callback
                                        .call(value, ThreadsafeFunctionCallMode::NonBlocking);
                                    continue;
                                }
                                Err(e) => {
                                    println!("[ERROR] Error deserializing message1: {e}");
                                }
                            }

                            match serde_json::from_str::<
                                PasskeyMessage<PasskeyAssertionWithoutUserInterfaceRequest>,
                            >(&message)
                            {
                                Ok(msg) => {
                                    let value = msg
                                        .value
                                        .map(|value| (client_id, msg.sequence_number, value))
                                        .map_err(|e| napi::Error::from_reason(format!("{e:?}")));

                                    assertion_without_user_interface_callback
                                        .call(value, ThreadsafeFunctionCallMode::NonBlocking);
                                    continue;
                                }
                                Err(e) => {
                                    println!("[ERROR] Error deserializing message1: {e}");
                                }
                            }

                            match serde_json::from_str::<PasskeyMessage<PasskeyRegistrationRequest>>(
                                &message,
                            ) {
                                Ok(msg) => {
                                    let value = msg
                                        .value
                                        .map(|value| (client_id, msg.sequence_number, value))
                                        .map_err(|e| napi::Error::from_reason(format!("{e:?}")));
                                    registration_callback
                                        .call(value, ThreadsafeFunctionCallMode::NonBlocking);
                                    continue;
                                }
                                Err(e) => {
                                    println!("[ERROR] Error deserializing message2: {e}");
                                }
                            }

                            println!("[ERROR] Received an unknown message2: {message:?}");
                        }
                    }
                }
            });

            let path = desktop_core::ipc::path(&name);

            let server = desktop_core::ipc::server::Server::start(&path, send).map_err(|e| {
                napi::Error::from_reason(format!(
                    "Error listening to server - Path: {path:?} - Error: {e} - {e:?}"
                ))
            })?;

            Ok(IpcServer { server })
        }

        /// Return the path to the IPC server.
        #[napi]
        pub fn get_path(&self) -> String {
            self.server.path.to_string_lossy().to_string()
        }

        /// Stop the IPC server.
        #[napi]
        pub fn stop(&self) -> napi::Result<()> {
            self.server.stop();
            Ok(())
        }

        #[napi]
        pub fn complete_registration(
            &self,
            client_id: u32,
            sequence_number: u32,
            response: PasskeyRegistrationResponse,
        ) -> napi::Result<u32> {
            let message = PasskeyMessage {
                sequence_number,
                value: Ok(response),
            };
            self.send(client_id, serde_json::to_string(&message).unwrap())
        }

        #[napi]
        pub fn complete_assertion(
            &self,
            client_id: u32,
            sequence_number: u32,
            response: PasskeyAssertionResponse,
        ) -> napi::Result<u32> {
            let message = PasskeyMessage {
                sequence_number,
                value: Ok(response),
            };
            self.send(client_id, serde_json::to_string(&message).unwrap())
        }

        #[napi]
        pub fn complete_error(
            &self,
            client_id: u32,
            sequence_number: u32,
            error: String,
        ) -> napi::Result<u32> {
            let message: PasskeyMessage<()> = PasskeyMessage {
                sequence_number,
                value: Err(BitwardenError::Internal(error)),
            };
            self.send(client_id, serde_json::to_string(&message).unwrap())
        }

        // TODO: Add a way to send a message to a specific client?
        fn send(&self, _client_id: u32, message: String) -> napi::Result<u32> {
            self.server
                .send(message)
                .map_err(|e| {
                    napi::Error::from_reason(format!("Error sending message - Error: {e} - {e:?}"))
                })
                // NAPI doesn't support u64 or usize, so we need to convert to u32
                .map(|u| u32::try_from(u).unwrap_or_default())
        }
    }
}

#[napi]
pub mod passkey_authenticator {
    #[napi]
    pub fn register() -> napi::Result<()> {
        crate::passkey_authenticator_internal::register().map_err(|e| {
            napi::Error::from_reason(format!("Passkey registration failed - Error: {e} - {e:?}"))
        })
    }
}

#[napi]
pub mod logging {
    use log::{Level, Metadata, Record};
    use napi::threadsafe_function::{
        ErrorStrategy::CalleeHandled, ThreadsafeFunction, ThreadsafeFunctionCallMode,
    };
    use std::sync::OnceLock;
    struct JsLogger(OnceLock<ThreadsafeFunction<(LogLevel, String), CalleeHandled>>);
    static JS_LOGGER: JsLogger = JsLogger(OnceLock::new());

    #[napi]
    pub enum LogLevel {
        Trace,
        Debug,
        Info,
        Warn,
        Error,
    }

    impl From<Level> for LogLevel {
        fn from(level: Level) -> Self {
            match level {
                Level::Trace => LogLevel::Trace,
                Level::Debug => LogLevel::Debug,
                Level::Info => LogLevel::Info,
                Level::Warn => LogLevel::Warn,
                Level::Error => LogLevel::Error,
            }
        }
    }

    #[napi]
    pub fn init_napi_log(js_log_fn: ThreadsafeFunction<(LogLevel, String), CalleeHandled>) {
        let _ = JS_LOGGER.0.set(js_log_fn);
        let _ = log::set_logger(&JS_LOGGER);
        log::set_max_level(log::LevelFilter::Debug);
    }

    impl log::Log for JsLogger {
        fn enabled(&self, metadata: &Metadata) -> bool {
            metadata.level() <= log::max_level()
        }

        fn log(&self, record: &Record) {
            if !self.enabled(record.metadata()) {
                return;
            }
            let Some(logger) = self.0.get() else {
                return;
            };
            let msg = (record.level().into(), record.args().to_string());
            let _ = logger.call(Ok(msg), ThreadsafeFunctionCallMode::NonBlocking);
        }

        fn flush(&self) {}
    }
}

#[napi]
pub mod autotype {
    #[napi]
    pub fn get_foreground_window_title() -> napi::Result<String, napi::Status> {
        autotype::get_foreground_window_title().map_err(|_| {
            napi::Error::from_reason(
                "Autotype Error: failed to get foreground window title".to_string(),
            )
        })
    }

    #[napi]
    pub fn type_input(input: Vec<u16>) -> napi::Result<(), napi::Status> {
        autotype::type_input(input).map_err(|_| {
            napi::Error::from_reason("Autotype Error: failed to type input".to_string())
        })
    }
}
