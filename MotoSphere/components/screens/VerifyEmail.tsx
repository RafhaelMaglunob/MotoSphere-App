import { Button, View, Text } from 'react-native';
import { sendVerificationEmail } from '../services/email.service';

export default function VerifyEmail() {
    const email = 'motosphere.smart@gmail.com';
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    return (
        <View>
            <Text>Email Verification</Text>
            <Button
                title="Send Code"
                onPress={() => sendVerificationEmail(email, code)}
            />
        </View>
    );
}
