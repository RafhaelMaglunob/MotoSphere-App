import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import UserIcon from '../svg/ProfileIcon';

interface TopBarProps {
    onBurgerClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onBurgerClick }) => {
    return (
        <View style={styles.container}>
            <Pressable onPress={onBurgerClick}>
                <MaterialIcons name="menu" size={28} color="#fff" />
            </Pressable>

            <View style={styles.rightSection}>
                <View style={styles.separator} />

                <View style={styles.outerCircle}>
                    <View style={styles.innerCircle}>
                        <UserIcon color={'#22D3EE'} />
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#050816',
        paddingVertical: 13,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    separator: {
        width: 2,
        height: 30,
        backgroundColor: '#334155',
        marginRight: 20,
    },
    outerCircle: {
        backgroundColor: 'rgba(46, 168, 255, 0.05)',
        padding: 5,
        borderRadius: 50, // fully rounded
    },
    innerCircle: {
        backgroundColor: 'rgba(6, 182, 212, 0.2)',
        padding: 8,
        borderRadius: 50, // fully rounded
    },
});

export default TopBar;
