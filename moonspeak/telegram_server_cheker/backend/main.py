import telebot
import os

bot = telebot.TeleBot(os.getenv('MOONSPEAK_TGBOT_TOKEN'))

#Список доверенных id
admin_ids = [os.getenv('MOONSPEAK_ADMIN_ID_0'),os.getenv('MOONSPEAK_ADMIN_ID_1')]

#Достаем user_id
@bot.message_handler(commands=['start'])
def start(message):
    user_id = message.from_user.id
    if str(user_id) in admin_ids:
        bot.send_message(message.chat.id,"Привет, админ!")
    else:
        bot.send_message(message.chat.id,"У вас нет доступа к даным бота")
print('Started')
bot.infinity_polling()
