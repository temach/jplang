import telebot
import os
import docker

bot = telebot.TeleBot(os.getenv('MOONSPEAK_TGBOT_TOKEN'))

#list of trust id
admin_ids = [os.getenv('MOONSPEAK_ADMIN_ID_0'),os.getenv('MOONSPEAK_ADMIN_ID_1')]

#return information about the docker containers

# using docker client
client = docker.from_env()


def docker_information():
    
    #return containers list
    containers = client.containers.list()

    # forming a dictionary with information
    containers_name = []
    for container in containers:
        containers_name.append(client.containers.get(container.id).name)

    docker_information = {}
    docker_information['containers_len'] = len(containers)
    docker_information['containers_name'] = containers_name

    return docker_information


#bot
@bot.message_handler(commands=['start'])
def start(message):
    #user_id_checking
    user_id = message.from_user.id
    
    if str(user_id) not in admin_ids:
        bot.send_message(message.chat.id,"No access!") 
        return

    #using def
    docker_info = docker_information()

    bot.send_message(message.chat.id,"Running containers - {containers_len}".format (containers_len= docker_info['containers_len']))

    #forming string from the list
    i=0
    while i < len(docker_info['containers_name']):
        docker_info['containers_name'][i] = '- '+docker_info['containers_name'][i]+'\n'
        i+=1
    container_names = ''.join(docker_info['containers_name'])   
    bot.send_message(message.chat.id,'Containers:\n'+container_names)


print('Started')
bot.infinity_polling()
